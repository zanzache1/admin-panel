import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc, serverTimestamp, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-storage.js";
import { firebaseConfig, ADMIN_EMAIL, EMAIL_EXTENSION_ENABLED } from "../firebase-config.js";

const $ = (id) => document.getElementById(id);
const configured = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("ضع-") &&
  firebaseConfig.projectId && !firebaseConfig.projectId.includes("ضع-") &&
  ADMIN_EMAIL && !ADMIN_EMAIL.includes("ضع-");
const loginStatus = $("loginStatus");
const setupNotice = $("setupNotice");
let auth, db, storage;
let subscribers = [];

if (!configured) {
  setupNotice.hidden = false;
  setupNotice.textContent = "أكمل إعداد Firebase والبريد الإداري في firebase-config.js، ثم انشر قواعد الأمان.";
  $("loginForm").querySelector("button").disabled = true;
} else {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}
$("mailSetupNotice").hidden = EMAIL_EXTENSION_ENABLED;
$("sendMailButton").disabled = !EMAIL_EXTENSION_ENABLED || !configured;

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!auth) return;
  loginStatus.textContent = "جارٍ التحقق...";
  try {
    await signInWithEmailAndPassword(auth, $("loginEmail").value.trim(), $("loginPassword").value);
  } catch (error) {
    console.error(error);
    loginStatus.textContent = "تعذر الدخول. تحقق من البريد وكلمة المرور وإعدادات Firebase.";
    loginStatus.className = "status small mt-3 text-danger";
  }
});

$("logoutButton").addEventListener("click", () => signOut(auth));

if (auth) onAuthStateChanged(auth, async (user) => {
  if (!user) {
    $("adminPanel").hidden = true;
    $("loginPanel").hidden = false;
    return;
  }
  if ((user.email || "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    await signOut(auth);
    loginStatus.textContent = "هذا الحساب غير مخوّل لإدارة الموقع.";
    loginStatus.className = "status small mt-3 text-danger";
    return;
  }
  $("loginPanel").hidden = true;
  $("adminPanel").hidden = false;
  $("signedInEmail").textContent = user.email;
  await Promise.all([loadSettings(), loadMessages(), loadSubscribers()]);
});

async function loadSettings() {
  try {
    const snap = await getDoc(doc(db, "settings", "site"));
    const links = snap.exists() ? (snap.data().links || {}) : {};
    $("linkIsnaad").value = links.isnaad || "https://zanzache1.github.io/isnaadtarbaoui/";
    $("linkTaateer").value = links.taateer || "https://med27771.github.io/zanzache1/";
    $("linkTarkia").value = links.tarkia || "https://zanzache1.github.io/tarkia/";
    $("linkTarssim").value = links.tarssim || "https://zanzache1.github.io/tarssim/";
  } catch (error) { status("linksStatus", "تعذر تحميل الإعدادات. تحقق من قواعد Firestore.", true); console.error(error); }
}

$("linksForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const links = {
    isnaad: $("linkIsnaad").value.trim(), taateer: $("linkTaateer").value.trim(),
    tarkia: $("linkTarkia").value.trim(), tarssim: $("linkTarssim").value.trim()
  };
  if (Object.values(links).some((value) => { try { return new URL(value).protocol !== "https:"; } catch { return true; } }))
    return status("linksStatus", "استخدم روابط HTTPS صحيحة.", true);
  try {
    await setDoc(doc(db, "settings", "site"), { links, updatedAt: serverTimestamp() }, { merge: true });
    status("linksStatus", "حُفظت الروابط، وستظهر للزوار بعد تحديث الصفحة.");
  } catch (error) { console.error(error); status("linksStatus", "فشل الحفظ. تحقق من قواعد Firestore.", true); }
});

$("imageForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = $("galleryImage").files[0];
  if (!file) return status("imageStatus", "اختر صورة أولاً.", true);
  if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)
    return status("imageStatus", "اختر صورة لا يتجاوز حجمها 5 ميغابايت.", true);
  const button = $("imageForm").querySelector("button"); button.disabled = true;
  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const imageRef = ref(storage, `gallery/${Date.now()}-${safeName}`);
    await uploadBytes(imageRef, file, { contentType: file.type });
    const galleryUrl = await getDownloadURL(imageRef);
    await setDoc(doc(db, "settings", "site"), { galleryUrl, updatedAt: serverTimestamp() }, { merge: true });
    $("imageForm").reset();
    status("imageStatus", "رُفعت الصورة وحُفظ رابطها.");
  } catch (error) {
    console.error(error);
    status("imageStatus", "فشل الرفع. يلزم تفعيل Storage وقواعده وخطة Blaze.", true);
  } finally { button.disabled = false; }
});

$("refreshMessages").addEventListener("click", loadMessages);
async function loadMessages() {
  const container = $("messagesList"); container.replaceChildren();
  try {
    const snap = await getDocs(query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(100)));
    const items = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    items.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    if (!items.length) return $("messagesStatus").textContent = "لا توجد رسائل حالياً.";
    $("messagesStatus").textContent = `آخر ${Math.min(items.length, 100)} رسالة`;
    for (const item of items.slice(0, 100)) {
      const box = document.createElement("article"); box.className = "message-item";
      const heading = document.createElement("strong"); heading.textContent = `${item.name || "زائر"} — ${item.type || "رسالة"}`;
      const email = document.createElement("div"); email.textContent = item.email || "";
      const body = document.createElement("p"); body.className = "mb-1 mt-2"; body.textContent = item.message || "";
      const date = document.createElement("small"); date.className = "text-secondary";
      date.textContent = item.createdAt?.toDate?.().toLocaleString("ar-DZ") || "";
      box.append(heading, email, body, date); container.append(box);
    }
  } catch (error) { console.error(error); $("messagesStatus").textContent = "تعذر تحميل الرسائل؛ تحقق من قواعد Firestore."; }
}

$("refreshSubscribers").addEventListener("click", loadSubscribers);
async function loadSubscribers() {
  try {
    const snap = await getDocs(query(collection(db, "subscribers"), limit(500)));
    subscribers = snap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.email);
    const select = $("recipient"); select.replaceChildren(new Option("اختر مستلماً", ""));
    if (subscribers.length) select.add(new Option(`أول 100 مشترك (من ${subscribers.length})`, "__all__"));
    const list = $("subscribersList"); list.replaceChildren();
    for (const item of subscribers) {
      select.add(new Option(item.email, item.email));
      const li = document.createElement("li"); li.className = "list-group-item"; li.textContent = item.email; list.append(li);
    }
    $("subscribersStatus").textContent = `${subscribers.length} مشترك`;
  } catch (error) { console.error(error); $("subscribersStatus").textContent = "تعذر تحميل المشتركين؛ تحقق من قواعد Firestore."; }
}

$("sendMailButton").addEventListener("click", async () => {
  const recipient = $("recipient").value;
  const subject = $("mailSubject").value.trim();
  const text = $("mailText").value.trim();
  if (!EMAIL_EXTENSION_ENABLED) return status("mailStatus", "إرسال البريد غير مهيأ بعد.", true);
  if (!recipient || !subject || !text) return status("mailStatus", "اختر المستلم واكتب الموضوع والرسالة.", true);
  const to = recipient === "__all__" ? subscribers.map((item) => item.email).slice(0, 100) : recipient;
  if (!to.length) return status("mailStatus", "لا يوجد مشتركون لإرسال الرسالة إليهم.", true);
  try {
    await addDoc(collection(db, "mail"), { to, message: { subject, text }, createdAt: serverTimestamp() });
    $("mailText").value = ""; $("mailSubject").value = "";
    status("mailStatus", "أُضيفت الرسالة إلى قائمة الإرسال.");
  } catch (error) { console.error(error); status("mailStatus", "تعذر تجهيز الرسالة. تحقق من إضافة البريد وقواعد Firestore.", true); }
});

function status(id, message, isError = false) {
  const node = $(id); node.textContent = message;
  node.classList.toggle("text-danger", isError); node.classList.toggle("text-success", !isError);
}