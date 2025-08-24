// app.js
(function(){
  const { auth, db } = window.FirebaseCtx;

  // UI
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userEmailSpan = document.getElementById('userEmail');

  const monthLabel = document.getElementById('monthLabel');
  const currentMonthShort = document.getElementById('currentMonthShort');
  const currentMonthLong = document.getElementById('currentMonthLong');
  const prevMonthBtn = document.getElementById('prevMonth');
  const nextMonthBtn = document.getElementById('nextMonth');

  const dateInput = document.getElementById('dateInput');
  const payerInput = document.getElementById('payerInput');
  const categoryInput = document.getElementById('categoryInput');
  const memoInput = document.getElementById('memoInput');
  const amountInput = document.getElementById('amountInput');
  const addBtn = document.getElementById('addBtn');
  const clearBtn = document.getElementById('clearBtn');
  const status = document.getElementById('status');

  const listBody = document.getElementById('listBody');
  const csvBtn = document.getElementById('csvBtn');

  const editDialog = document.getElementById('editDialog');
  const editId = document.getElementById('editId');
  const editDate = document.getElementById('editDate');
  const editPayer = document.getElementById('editPayer');
  const editCategory = document.getElementById('editCategory');
  const editMemo = document.getElementById('editMemo');
  const editAmount = document.getElementById('editAmount');
  const saveEditBtn = document.getElementById('saveEditBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  let categoryChart;
  let currentUser = null;
  let currentMonth = new Date(); currentMonth.setDate(1);
  let currentDocs = [];

  function yyyymm(d){ const y=d.getFullYear(); const m=('0'+(d.getMonth()+1)).slice(-2); return `${y}-${m}`; }
  function formatJPY(n){ return Number(n||0).toLocaleString('ja-JP',{maximumFractionDigits:0}); }
  function formatDateStr(str){ const [y,m,d]=str.split('-').map(Number); return `${m}/${d}`; }

  function setMonthLabel(){
    const y = currentMonth.getFullYear(); const m = currentMonth.getMonth()+1;
    const short = `${m}月`; const long = `${y}年${m}月`;
    monthLabel.textContent = long; currentMonthShort.textContent = short; currentMonthLong.textContent = long;
    const today = new Date(); const candidate = new Date(currentMonth);
    if (today.getMonth()===currentMonth.getMonth() && today.getFullYear()===currentMonth.getFullYear()){
      dateInput.valueAsDate = today;
    } else { candidate.setDate(1); dateInput.valueAsDate = candidate; }
  }

  async function signInPopup(){
    try {
      await window.FirebaseCtx.signInPopupPreferred();
    } catch (e){
      console.error(e);
      status.textContent = 'ログインに失敗しました。ポップアップがブロックされていないか確認してください。';
    }
  }

  loginBtn.addEventListener('click', signInPopup);
  logoutBtn.addEventListener('click', async () => { await auth.signOut(); });

  function docToRow(doc){
//    const d = doc.data(); // bug doc is not function but object
    const d = doc.data;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDateStr(d.dateStr)}</td>
      <td>${d.payer}</td>
      <td>${d.category}</td>
      <td>${(d.memo||'').replace(/</g,'&lt;')}</td>
      <td class="num">${formatJPY(d.amount)}</td>
      <td>
        <button class="btn" data-edit="${doc.id}">編集</button>
        <button class="btn" data-del="${doc.id}">削除</button>
      </td>`;
    return tr;
  }

  function renderList(){
    listBody.innerHTML='';
    currentDocs.sort((a,b)=> a.data.dateStr.localeCompare(b.data.dateStr));
    for (const doc of currentDocs){ listBody.appendChild(docToRow(doc)); }
  }

  // グラフ表示機能
  function renderTotalsAndChart(){
    const sumsByPayer = {'おっと':0,'つま':0,'共通':0};
    const sumsByCat = {};
    for (const {data} of currentDocs){
      sumsByPayer[data.payer] = (sumsByPayer[data.payer]||0) + Number(data.amount||0);
      sumsByCat[data.category] = (sumsByCat[data.category]||0) + Number(data.amount||0);
    }
    document.getElementById('sumHusband').textContent = `¥${formatJPY(sumsByPayer['おっと']||0)}`;
    document.getElementById('sumWife').textContent = `¥${formatJPY(sumsByPayer['つま']||0)}`;
    document.getElementById('sumShared').textContent = `¥${formatJPY(sumsByPayer['共通']||0)}`;
    const total = (sumsByPayer['おっと']||0) + (sumsByPayer['つま']||0) + (sumsByPayer['共通']||0);
    document.getElementById('sumTotal').textContent = `¥${formatJPY(total)}`;

    const labels = Object.keys(sumsByCat);
    const data = labels.map(k=>sumsByCat[k]);
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChart){ categoryChart.destroy(); }
    categoryChart = new Chart(ctx, {
      type:'bar',
      data:{ labels, datasets:[{label:'金額（円）', data}]},
      options:{
        responsive:true,
        plugins:{ legend:{display:true}, title:{display:false}},
        scales:{ y:{ ticks:{ callback: v => '¥'+Number(v).toLocaleString('ja-JP')}}}
      }
    });
  }

  // 当月のデータを表示する
  async function reloadMonth(){
    if (!currentUser) return;
    const key = yyyymm(currentMonth);
    try {
      const snap = await window.FirebaseCtx.db.collection('expenses')
        .where('ownerUid','==', currentUser.uid)
        .where('monthKey','==', key)
        .orderBy('dateStr').get();
      currentDocs = snap.docs.map(d => ({id:d.id, data:d.data()}));
      renderList();
      renderTotalsAndChart();      
      // namespace apiの記述となっている下記のように書いてもOK
      // var expensesRef = window.FirebaseCtx.db.collection("expenses");
      // var query = expensesRef.where('ownerUid','==', currentUser.uid).where('monthKey','==', key).orderBy('dateStr');
      // const snap = await query.get();
      // alert(snap);
    } catch (e){ console.error(e); status.textContent = 'データ取得に失敗しました。'; }
  }

  prevMonthBtn.addEventListener('click', async ()=>{ currentMonth.setMonth(currentMonth.getMonth()-1); setMonthLabel(); await reloadMonth(); });
  nextMonthBtn.addEventListener('click', async ()=>{ currentMonth.setMonth(currentMonth.getMonth()+1); setMonthLabel(); await reloadMonth(); });

  addBtn.addEventListener('click', async () => {
    if (!currentUser){ status.textContent='ログインしてください。'; return; }
    const dateStr = dateInput.value;
    const payer = payerInput.value;
    const category = categoryInput.value;
    const memo = memoInput.value.trim();
    const amount = Number(amountInput.value);
    if (!dateStr || !(amount >= 0)){ status.textContent='日付と金額を入力してください。'; return; }
    const monthKey = dateStr.slice(0,7);
    try {
      await window.FirebaseCtx.db.collection('expenses').add({
        ownerUid: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        dateStr, payer, category, memo, amount, monthKey
      });
      status.textContent='追加しました。'; memoInput.value=''; amountInput.value=''; await reloadMonth();
    } catch(e){ console.error(e); status.textContent='追加に失敗しました。'; }
  });

  clearBtn.addEventListener('click', ()=>{ memoInput.value=''; amountInput.value=''; status.textContent=''; });

  // 明細の削除機能
  listBody.addEventListener('click', async (e)=>{
    const t = e.target;
    if (t.dataset.edit){
      const id = t.dataset.edit;
      const doc = currentDocs.find(d=>d.id===id); if (!doc) return;
      editId.value=id; editDate.value=doc.data.dateStr; editPayer.value=doc.data.payer; editCategory.value=doc.data.category;
      editMemo.value=doc.data.memo||''; editAmount.value=doc.data.amount; editDialog.showModal();
    } else if (t.dataset.del){
      const id = t.dataset.del;
      if (!confirm('削除しますか？')) return;
      try { await window.FirebaseCtx.db.collection('expenses').doc(id).delete(); await reloadMonth(); }
      catch(e){ console.error(e); alert('削除に失敗しました。'); }
    }
  });

  // 明細の削除機能
  saveEditBtn.addEventListener('click', async (e)=>{
    e.preventDefault();
    const id = editId.value;
    try {
      await window.FirebaseCtx.db.collection('expenses').doc(id).update({
        dateStr: editDate.value, payer: editPayer.value, category: editCategory.value,
        memo: editMemo.value.trim(), amount: Number(editAmount.value),
        monthKey: editDate.value.slice(0,7),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      editDialog.close(); await reloadMonth();
    } catch(e){ console.error(e); alert('更新に失敗しました。'); }
  });
  cancelEditBtn.addEventListener('click', (e)=>{ e.preventDefault(); editDialog.close(); });

  // csvダウンロード機能
  csvBtn.addEventListener('click', ()=>{
    const header = ['date','payer','category','memo','amount'];
    const rows = currentDocs.map(({data})=>[data.dateStr,data.payer,data.category,(data.memo||'').replace(/\"/g,'\"\"'),data.amount]);
    const csv = [header.join(','), ...rows.map(r => r.map((x,i)=> i===3 ? `"${x}"` : x).join(','))].join('\r\n');
    const a = document.createElement('a'); const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
    a.href=url; a.download=`kakeibo-${yyyymm(currentMonth)}.csv`; a.click(); URL.revokeObjectURL(url);
  });

  (async function init(){
    setMonthLabel();
    const user = await window.FirebaseCtx.ensureSignedIn();
    if (user){
      currentUser=user; userEmailSpan.textContent=user.email||''; loginBtn.style.display='none'; logoutBtn.style.display='inline-block'; await reloadMonth();
    } else {
      userEmailSpan.textContent='未ログイン'; loginBtn.style.display='inline-block'; logoutBtn.style.display='none';
    }
    auth.onAuthStateChanged(async (u)=>{
      currentUser=u;
      if (u){ userEmailSpan.textContent=u.email||''; loginBtn.style.display='none'; logoutBtn.style.display='inline-block'; await reloadMonth(); }
      else { userEmailSpan.textContent='未ログイン'; loginBtn.style.display='inline-block'; logoutBtn.style.display='none'; currentDocs=[]; renderList(); renderTotalsAndChart(); }
      // else { userEmailSpan.textContent='未ログイン'; loginBtn.style.display='inline-block'; logoutBtn.style.display='none'; currentDocs=[]; renderList(); }
    });
  })();
})();
