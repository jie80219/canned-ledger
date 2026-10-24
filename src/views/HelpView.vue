<script setup lang="ts">
import TopBar from '../components/TopBar.vue'
</script>

<template>
  <main class="page no-nav help-page">
    <TopBar title="使用說明" back />

    <section class="card">
      <h3>🐹 資料存在哪？</h3>
      <p>所有資料都存在這個瀏覽器的 IndexedDB，不會上傳到任何伺服器。換來的代價是：<b>清除瀏覽器資料、刪掉主畫面 App 就會遺失</b>。請定期到「設定 → 資料」下載 JSON 備份。</p>
      <p>iPhone 請用 Safari「分享 → 加入主畫面」安裝。沒安裝的話，Safari 可能在 7 天沒開啟後清除網站資料。</p>
    </section>

    <section class="card">
      <h3>💳 信用卡自動扣款</h3>
      <p>在信用卡的「編輯」設定結帳日、繳款日與扣款帳戶，打開「自動扣款」。每到繳款日，App 會記一筆「銀行 → 信用卡」的轉帳：</p>
      <ul>
        <li>應繳金額＝結帳日當天的欠款 − 結帳後到繳款日之間已經繳的錢。退款、提前繳款、上期沒繳完都會自動算進去。</li>
        <li>開啟「扣款前先讓我確認」時，這筆會先標成待確認，可以改成實際帳單金額。</li>
        <li>只會補產生開啟自動扣款之後的繳款日，不會補出舊帳。</li>
      </ul>
    </section>

    <section class="card">
      <h3>🌏 外幣訂閱</h3>
      <p>週期記帳的金額可以直接填外幣（例如 15.99 USD）。到期時用扣款當天的匯率換算，信用卡會再加上海外手續費。</p>
      <ul>
        <li><b>待確認模式</b>：先用估算金額入帳，等信用卡帳單出來，打開那筆交易填實際台幣金額，系統會反推實際匯率。</li>
        <li>匯率取自免費的公開匯率 API，離線時用最近一次的快取，完全沒有匯率時會轉成待確認。</li>
      </ul>
    </section>

    <section class="card">
      <h3>⏰ 為什麼要打開 App 才會記？</h3>
      <p>網頁沒有背景執行，所以週期記帳和自動扣款是在<b>打開 App 或切回前景時</b>一次補齊。補記的交易日期是正確的到期日，不影響統計；同一期不會重複產生。也因此沒有推播提醒。</p>
    </section>

    <section class="card">
      <h3>🧾 電子發票</h3>
      <p>到財政部電子發票整合服務平台登入，在載具的消費明細匯出 CSV，再到「設定 → 資料」匯入。可以設定「店家 → 分類」規則，下次自動分類；同一張發票只會匯入一次。</p>
    </section>

    <section class="card">
      <h3>⌨️ 小技巧</h3>
      <ul>
        <li>金額鍵盤可以直接算：120+85×2。</li>
        <li>統計頁點甜甜圈或分類，可以看到該分類的子分類與每一筆明細。</li>
        <li>預算起算日可以設成發薪日。</li>
        <li>編輯交易時右上角 ⧉ 可以複製成新的一筆。</li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.help-page h3 { margin: 0 0 6px; font-size: 1rem; }
.help-page p, .help-page li { font-size: 0.875rem; line-height: 1.65; margin: 6px 0; }
.help-page ul { padding-left: 20px; margin: 6px 0; }
</style>
