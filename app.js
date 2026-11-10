const messages = [
  {id:1,from:"GitHub",email:"noreply@github.com",initials:"GH",avatar:"github",subject:"Your GitHub verification code",snippet:"Use this code to finish signing in to your account.",time:"10:42 AM",date:"Today, 10:42 AM",category:"Updates",label:"Security",tag:"Security",unread:true,starred:true,body:"A sign-in attempt needs your confirmation. Use the verification code below to continue. If you did not request this code, you can safely ignore this email.",otp:"482 195"},
  {id:2,from:"Maya Chen",email:"maya.chen@example.com",initials:"MC",avatar:"figma",subject:"A few ideas for the new project",snippet:"I put together some thoughts after our call yesterday.",time:"9:18 AM",date:"Today, 9:18 AM",category:"Primary",label:"Work",tag:"Work",unread:true,starred:false,body:"I put together a few ideas after our call yesterday. The direction is looking really good, and I think we can make the first version feel much more focused. Let me know what you think when you have a moment."},
  {id:3,from:"Notion",email:"team@notion.so",initials:"N",avatar:"notion",subject:"Your weekly workspace summary",snippet:"See what changed across your workspace this week.",time:"8:05 AM",date:"Today, 8:05 AM",category:"Updates",label:"Work",tag:"Updates",unread:true,starred:false,body:"Here is your weekly workspace summary. You have 4 updated pages, 2 new comments and 1 task waiting for your review."},
  {id:4,from:"Spotify",email:"no-reply@spotify.com",initials:"S",avatar:"spotify",subject:"A new sign-in to your account",snippet:"We noticed a sign-in from a new device.",time:"Yesterday",date:"Yesterday, 6:30 PM",category:"Updates",label:"Security",tag:"Security",unread:false,starred:false,body:"We noticed a sign-in to your account from a new device. If this was you, there is nothing else you need to do. If you do not recognize this activity, please secure your account."},
  {id:5,from:"Jordan Lee",email:"jordan.lee@example.com",initials:"JL",avatar:"work",subject:"Friday catch-up ☕",snippet:"Are we still on for Friday afternoon?",time:"Yesterday",date:"Yesterday, 3:12 PM",category:"Primary",label:"Personal",tag:"Personal",unread:false,starred:true,body:"Hey! Are we still on for Friday afternoon? I found a nice little coffee place near the park. Let me know if 3 PM works for you."},
  {id:6,from:"Google",email:"no-reply@accounts.google.com",initials:"G",avatar:"google",subject:"Security alert for your account",snippet:"A new app has access to your Google Account.",time:"Mon",date:"Monday, 11:24 AM",category:"Updates",label:"Security",tag:"Security",unread:false,starred:false,body:"A new app was granted access to your Google Account. Review the connected app and permissions in your account security settings."},
  {id:7,from:"Studio Supply",email:"hello@studiosupply.example",initials:"SS",avatar:"shop",subject:"Your order is on the way",snippet:"Good news — your package has shipped.",time:"Mon",date:"Monday, 9:40 AM",category:"Updates",label:"Personal",tag:"Personal",unread:false,starred:false,body:"Your order is on the way. You can follow the delivery progress from your order page. Thank you for shopping with us."},
  {id:8,from:"The Daily Brief",email:"digest@dailybrief.example",initials:"DB",avatar:"news",subject:"The 5 stories worth your time today",snippet:"A quick read to get your day started.",time:"Sun",date:"Sunday, 8:00 AM",category:"Updates",label:"Personal",tag:"Updates",unread:false,starred:false,body:"A quick selection of five stories worth your time today. Take a look at the topics shaping the week."}
];
let activeFolder = "Inbox";
let activeTab = "Primary";
let selectedId = 1;
let searchTerm = "";
let toastTimer;

const $ = (selector) => document.querySelector(selector);
const icon = (name) => '<svg><use href="#i-' + name + '"></use></svg>';
const visibleMessages = () => {
  let list = [...messages];
  if (activeFolder === "Starred") list = list.filter(m => m.starred);
  else if (activeFolder === "Sent" || activeFolder === "Drafts" || activeFolder === "Snoozed" || activeFolder === "Archive" || activeFolder === "Trash") list = [];
  else if (activeFolder !== "Inbox") list = list.filter(m => m.label === activeFolder);
  if (activeFolder === "Inbox" && activeTab !== "All") list = list.filter(m => activeTab === "Primary" ? m.category === "Primary" : m.category === "Updates");
  if (searchTerm) list = list.filter(m => [m.from,m.email,m.subject,m.snippet,m.otp || "",m.body].join(" ").toLowerCase().includes(searchTerm));
  return list;
};

function renderList() {
  const list = visibleMessages();
  $("#folderTitle").firstChild.textContent = activeFolder;
  $("#folderTotal").textContent = list.length;
  $("#listRange").textContent = list.length ? "1–" + list.length + " of " + list.length : "0 messages";
  $("#mailList").innerHTML = list.length ? list.map(m => `
    <div class="mail-row ${m.unread ? "unread" : ""} ${m.id === selectedId ? "selected" : ""}" data-id="${m.id}" tabindex="0" role="button" aria-label="Open email from ${m.from}">
      <div class="avatar avatar-${m.avatar}">${m.initials}</div>
      <div class="row-main"><div class="row-meta"><span class="sender">${m.from}</span><span class="row-tag tag-${m.tag.toLowerCase()}">${m.tag}</span></div><div class="subject">${m.subject}</div><div class="snippet">${m.snippet}</div></div>
      <div class="row-end"><span class="row-date">${m.time}</span><button class="row-star ${m.starred ? "starred" : ""}" data-star="${m.id}" aria-label="Toggle star">${icon("star")}</button></div>
    </div>`).join("") : '<div class="no-results"><strong>Nothing here yet</strong>Try another folder or search term.</div>';
  $("#mailList").querySelectorAll(".mail-row").forEach(row => {
    row.addEventListener("click", e => {
      if (e.target.closest("[data-star]")) return;
      openMessage(Number(row.dataset.id));
    });
    row.addEventListener("keydown", e => { if (e.key === "Enter") openMessage(Number(row.dataset.id)); });
  });
  $("#mailList").querySelectorAll("[data-star]").forEach(button => button.addEventListener("click", e => {
    e.stopPropagation();
    const m = messages.find(item => item.id === Number(button.dataset.star));
    m.starred = !m.starred;
    renderList();
    if (selectedId === m.id) renderReader();
  }));
  document.querySelectorAll(".nav-item[data-folder],.nav-item[data-label]").forEach(item => item.classList.toggle("active", item.dataset.folder === activeFolder || item.dataset.label === activeFolder));
}

function renderReader() {
  const m = messages.find(item => item.id === selectedId);
  if (!m) {
    $("#readerEmpty").style.display = "flex";
    $("#emailReader").classList.remove("visible");
    return;
  }
  $("#readerEmpty").style.display = "none";
  $("#emailReader").classList.add("visible");
  const otpCard = m.otp ? `
    <div class="otp-card"><div class="otp-label">Your one-time verification code</div><div class="otp-line"><div class="otp-code" id="otpValue">${m.otp}</div><button class="copy-code" id="copyOtp">${icon("copy")} Copy code</button></div><div class="otp-hint">This code is for your account sign-in. Never share it with anyone.</div></div>` : "";
  $("#emailReader").innerHTML = `
    <div class="reader-toolbar"><div class="reader-toolbar-left"><button class="icon-button" id="readerBack" aria-label="Back to inbox">${icon("chevron")}</button><button class="icon-button" id="archiveMessage" aria-label="Archive">${icon("archive")}</button><button class="icon-button" id="deleteMessage" aria-label="Delete">${icon("trash")}</button></div><div class="reader-toolbar-right"><span class="reader-counter">1 of ${messages.length}</span><button class="icon-button" id="readerMore" aria-label="More options">${icon("more")}</button></div></div>
    <h2 class="reader-subject">${m.subject}</h2>
    <div class="reader-pills"><span class="reader-pill">${m.tag}</span><span class="reader-pill neutral">${m.unread ? "Unread" : "Inbox"}</span></div>
    <div class="sender-block"><div class="avatar avatar-${m.avatar}">${m.initials}</div><div class="sender-details"><div class="sender-name">${m.from}</div><div class="sender-address">${m.email} <span>to me</span></div></div><span class="sender-time">${m.date}</span></div>
    <div class="email-body"><p class="hello">Hi Alex,</p><p>${m.body}</p>${otpCard}<p>Thanks,<br><strong>${m.from} team</strong></p></div>
    <div class="email-signature">This is a sample message in <strong>CMail UI preview</strong>. Live email delivery is not connected.</div>
    <div class="reader-bottom-actions"><button class="outline-action" id="replyButton">${icon("send")} Reply</button><button class="outline-action" id="forwardButton">${icon("send")} Forward</button></div>`;
  if (m.otp) $("#copyOtp").addEventListener("click", () => copyText(m.otp.replaceAll(" ", ""), "OTP copied"));
  $("#readerBack").addEventListener("click", closeMobileReader);
  $("#archiveMessage").addEventListener("click", () => moveMessage("Archive"));
  $("#deleteMessage").addEventListener("click", () => moveMessage("Trash"));
  $("#replyButton").addEventListener("click", () => { openCompose(); $("#composeTo").value = m.email; $("#composeSubject").value = "Re: " + m.subject; });
  $("#forwardButton").addEventListener("click", () => { openCompose(); $("#composeSubject").value = "Fwd: " + m.subject; $("#composeBody").value = "\n\n---------- Forwarded message ----------\n" + m.body; });
}
function openMessage(id) {
  selectedId = id;
  const m = messages.find(item => item.id === id);
  if (m) m.unread = false;
  renderList();
  renderReader();
  if (window.innerWidth <= 850) {
    $("#readerPanel").classList.add("mobile-open");
    $("#mobileBackdrop").classList.add("show");
  }
}
function closeMobileReader() {
  $("#readerPanel").classList.remove("mobile-open");
  $("#mobileBackdrop").classList.remove("show");
}
function moveMessage(folder) {
  const index = messages.findIndex(m => m.id === selectedId);
  if (index >= 0) messages.splice(index, 1);
  activeFolder = folder;
  $("#breadcrumbFolder").textContent = folder;
  renderList();
  renderReader();
  closeMobileReader();
  showToast("Message moved to " + folder.toLowerCase());
}
function showToast(message) {
  $("#toastMessage").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 2300);
}
async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message || "Copied to clipboard");
  } catch {
    showToast("Copy is unavailable in this browser");
  }
}
function openCompose() {
  $("#composeModal").classList.add("open");
  $("#composeModal").setAttribute("aria-hidden", "false");
  setTimeout(() => $("#composeTo").focus(), 50);
}
function closeCompose() {
  $("#composeModal").classList.remove("open");
  $("#composeModal").setAttribute("aria-hidden", "true");
}

document.querySelectorAll(".nav-item[data-folder],.nav-item[data-label]").forEach(item => item.addEventListener("click", () => {
  activeFolder = item.dataset.folder || item.dataset.label;
  activeTab = "All";
  $("#breadcrumbFolder").textContent = activeFolder;
  document.querySelectorAll(".mail-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.tab === "All"));
  renderList();
  const first = visibleMessages()[0];
  selectedId = first ? first.id : null;
  renderReader();
  closeMobileReader();
}));
document.querySelectorAll(".mail-tab").forEach(tab => tab.addEventListener("click", () => {
  activeTab = tab.dataset.tab;
  document.querySelectorAll(".mail-tab").forEach(t => t.classList.toggle("active", t === tab));
  renderList();
  const first = visibleMessages()[0];
  selectedId = first ? first.id : null;
  renderReader();
}));
$("#searchInput").addEventListener("input", e => {
  searchTerm = e.target.value.trim().toLowerCase();
  renderList();
});
$("#composeButton").addEventListener("click", openCompose);
$("#closeCompose").addEventListener("click", closeCompose);
$("#composeModal").addEventListener("click", e => { if (e.target === $("#composeModal")) closeCompose(); });
document.addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); $("#searchInput").focus(); }
  if (e.key === "Escape") { closeCompose(); closeMobileReader(); }
});
$("#composeForm").addEventListener("submit", e => {
  e.preventDefault();
  closeCompose();
  e.target.reset();
  showToast("Demo only — connect an email service to send");
});
$("#refreshButton").addEventListener("click", () => { renderList(); showToast("Mailbox refreshed"); });
$("#filterButton").addEventListener("click", () => showToast("Filters will be available when mail sync is connected"));
$("#listMore").addEventListener("click", () => showToast("More mailbox options coming soon"));
$("#settingsButton").addEventListener("click", () => showToast("Account settings are part of the next setup step"));
$("#profileMenu").addEventListener("click", () => showToast("Personal account · Demo profile"));
$("#addLabel").addEventListener("click", () => showToast("Custom labels coming soon"));
$("#storageLink").addEventListener("click", e => { e.preventDefault(); showToast("Storage details will appear after setup"); });
$("#bannerLearn").addEventListener("click", () => showToast("Live mail needs an inbound email provider and a verified domain"));
$("#helpButton").addEventListener("click", () => showToast("CMail UI preview · Personal webmail interface"));
$("#menuButton").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#mobileBackdrop").addEventListener("click", closeMobileReader);
$("#themeButton").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("cmail-theme", document.body.classList.contains("dark") ? "dark" : "light");
});
if (localStorage.getItem("cmail-theme") === "dark") document.body.classList.add("dark");
renderList();
renderReader();
