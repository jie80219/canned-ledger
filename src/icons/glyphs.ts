// 自繪分類圖示：24×24、圓角筆畫，顏色跟著 currentColor。
// {f} = 淡色填滿，{F} = 實心填滿，渲染前由 glyphSvg() 展開。

export interface Glyph {
  name: string
  tags: string[]
  body: string
}

export const GLYPHS: Record<string, Glyph> = {
  // 餐飲
  'meal-bowl': { name: '碗筷', tags: ['餐飲', '吃飯', '麵'], body: '<path d="M3 11h18a9 9 0 0 1-18 0Z"{f}/><path d="M14 3l-3 8M19 4l-6 7"/>' },
  'meal-cutlery': { name: '刀叉', tags: ['餐飲', '西餐', '餐廳'], body: '<path d="M7 3v18M5 3v5a2 2 0 0 0 4 0V3"/><path d="M17 21V3c-2 1.5-3 4-3 7v3h3"{f}/>' },
  'meal-cloche': { name: '餐盤蓋', tags: ['餐飲', '大餐', '外送'], body: '<path d="M5 17a7 7 0 0 1 14 0Z"{f}/><path d="M3 17h18M4 20h16M12 10V8M10 8h4"/>' },
  // 早餐
  'bf-toast': { name: '吐司', tags: ['早餐', '麵包'], body: '<path d="M6 21V11a4 4 0 1 1 2-7.5h8A4 4 0 1 1 18 11v10Z"{f}/><path d="M9.5 14h5"/>' },
  'bf-egg': { name: '荷包蛋', tags: ['早餐', '蛋'], body: '<path d="M12 3c4 0 8 3 8 7s-2 4-2 7-3 4-6 4-8-1-8-6 3-6 4-9 1-3 4-3Z"/><circle cx="12" cy="12" r="3"{f}/>' },
  'bf-mug': { name: '馬克杯', tags: ['早餐', '咖啡', '豆漿'], body: '<path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"{f}/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3c-1 1.5 1 2.5 0 4M12 3c-1 1.5 1 2.5 0 4"/>' },
  // 午餐
  'lunch-bento': { name: '便當', tags: ['午餐', '便當'], body: '<rect x="3" y="8" width="18" height="12" rx="2"{f}/><path d="M3 12h18M12 12v8M5 5l14 2"/><circle cx="7.5" cy="16" r="1.5"/><path d="M15 15h3M15 17.5h3"/>' },
  'lunch-onigiri': { name: '飯糰', tags: ['午餐', '飯糰', '超商'], body: '<path d="M12 3.5c1.6 0 2.6 1 3.6 2.8l4.5 8.3c1.4 2.6-.2 5.4-3.1 5.4H7c-2.9 0-4.5-2.8-3.1-5.4l4.5-8.3C9.4 4.5 10.4 3.5 12 3.5Z"/><path d="M8.5 14h7v6h-7Z"{f}/>' },
  'lunch-burger': { name: '漢堡', tags: ['午餐', '速食'], body: '<path d="M4 11a8 6 0 0 1 16 0Z"{f}/><path d="M3 14.5h18M4 17.5h16a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3ZM9 8h.01M12.5 7h.01M15 8.5h.01"/>' },
  // 晚餐
  'dinner-hotpot': { name: '火鍋', tags: ['晚餐', '火鍋'], body: '<path d="M5 11h14v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z"{f}/><path d="M3 11h18M2 13h3M19 13h3M9 8c-1-1.5 1-2 0-4M15 8c-1-1.5 1-2 0-4"/>' },
  'dinner-ramen': { name: '拉麵', tags: ['晚餐', '麵'], body: '<path d="M3 12h18a9 8 0 0 1-18 0Z"{f}/><path d="M8 12V6M11 12V5M17 3l-6 3M19 6l-8 1"/>' },
  'dinner-skewer': { name: '串燒', tags: ['晚餐', '宵夜', '燒肉'], body: '<path d="M3.5 20.5 20.5 3.5"/><rect x="6" y="12.5" width="5.5" height="5.5" rx="1.5" transform="rotate(45 8.75 15.25)"{f}/><rect x="10.25" y="8.25" width="5.5" height="5.5" rx="1.5" transform="rotate(45 13 11)"{f}/><rect x="14.5" y="4" width="5.5" height="5.5" rx="1.5" transform="rotate(45 17.25 6.75)"{f}/>' },
  // 飲料
  'drink-boba': { name: '珍奶', tags: ['飲料', '手搖'], body: '<path d="M5 8h14l-1.6 12a1.5 1.5 0 0 1-1.5 1.3H8.1a1.5 1.5 0 0 1-1.5-1.3Z"{f}/><path d="M4 8h16M13 8l2-6"/><circle cx="10" cy="17.5" r="1"{F}/><circle cx="13.5" cy="18" r="1"{F}/><circle cx="12" cy="15.5" r="1"{F}/>' },
  'drink-juice': { name: '果汁', tags: ['飲料', '果汁'], body: '<path d="M6 4h12l-1.5 16a1.5 1.5 0 0 1-1.5 1.4H9a1.5 1.5 0 0 1-1.5-1.4Z"/><path d="M6.6 10h10.8l-.9 10a1.5 1.5 0 0 1-1.5 1.4H9a1.5 1.5 0 0 1-1.5-1.4Z"{f}/><circle cx="17" cy="5" r="3"/>' },
  'drink-coffee': { name: '外帶咖啡', tags: ['飲料', '咖啡'], body: '<path d="M6 7h12l-1.4 13a1.5 1.5 0 0 1-1.5 1.3H8.9a1.5 1.5 0 0 1-1.5-1.3Z"/><path d="M5 4.5h14V7H5ZM7.6 12h8.8l-.6 5H8.2Z"{f}/>' },
  // 零食
  'snack-cookie': { name: '餅乾', tags: ['零食', '點心'], body: '<path d="M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3-3 3 3 0 0 1-3-3 3 3 0 0 1-3-3Z"{f}/><circle cx="9" cy="10" r=".9"{F}/><circle cx="14" cy="15" r=".9"{F}/><circle cx="8.5" cy="15.5" r=".9"{F}/>' },
  'snack-candy': { name: '糖果', tags: ['零食', '糖'], body: '<circle cx="12" cy="12" r="4.5"{f}/><path d="M8 9.5 3 7v10l5-2.5M16 9.5 21 7v10l-5-2.5"/>' },
  'snack-icecream': { name: '冰淇淋', tags: ['零食', '甜點', '冰'], body: '<path d="M8 11l4 10 4-10"/><path d="M7 11a5 5 0 1 1 10 0Z"{f}/>' },
  // 交通
  'transit-car': { name: '汽車', tags: ['交通', '開車'], body: '<path d="M3 13l2-6a2 2 0 0 1 2-1.4h10a2 2 0 0 1 2 1.4l2 6v5H3Z"{f}/><path d="M3 13h18M6 18v2M18 18v2"/><circle cx="7" cy="15.5" r="1"/><circle cx="17" cy="15.5" r="1"/>' },
  'transit-scooter': { name: '機車', tags: ['交通', '機車'], body: '<circle cx="5.5" cy="17.5" r="2.5"{f}/><circle cx="18.5" cy="17.5" r="2.5"{f}/><path d="M8 17.5h7l3-7h-3M15 6h3l1 4.5M5.5 15 7 11h6"/>' },
  'transit-route': { name: '路線', tags: ['交通', '通勤'], body: '<circle cx="6" cy="18" r="2.5"/><path d="M18 3a4 4 0 0 0-4 4c0 3 4 6 4 6s4-3 4-6a4 4 0 0 0-4-4Z"{f}/><path d="M8.5 18H15a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h1"/>' },
  // 捷運
  'mrt-train': { name: '捷運車廂', tags: ['捷運', '火車', '高鐵'], body: '<rect x="5" y="3" width="14" height="14" rx="3"{f}/><path d="M5 10h14M9 21l1.5-4M15 21l-1.5-4M8 21h8"/><circle cx="9" cy="13.5" r=".9"{F}/><circle cx="15" cy="13.5" r=".9"{F}/>' },
  'mrt-card': { name: '交通卡', tags: ['捷運', '悠遊卡', '一卡通'], body: '<rect x="3" y="6" width="18" height="12" rx="2"{f}/><path d="M7 14h4M16.5 9.5a2.5 2.5 0 0 1 0 5M15 11a1 1 0 0 1 0 2"/>' },
  'mrt-sign': { name: '捷運站', tags: ['捷運', '車站'], body: '<circle cx="12" cy="12" r="9"{f}/><path d="M8 16V8l4 5 4-5v8"/>' },
  // 公車
  'bus-front': { name: '公車正面', tags: ['公車', '客運'], body: '<rect x="5" y="3" width="14" height="15" rx="2.5"{f}/><path d="M5 11h14M8 18v3M16 18v3M9 6h6"/><circle cx="8.5" cy="14.5" r=".9"{F}/><circle cx="15.5" cy="14.5" r=".9"{F}/>' },
  'bus-side': { name: '公車側面', tags: ['公車', '客運'], body: '<path d="M3 6h15a3 3 0 0 1 3 3v8H3Z"{f}/><path d="M3 11h18M8 6v5M13 6v5"/><circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/>' },
  'bus-stop': { name: '站牌', tags: ['公車', '等車'], body: '<path d="M12 21V11M9 21h6"/><rect x="7" y="3" width="10" height="8" rx="2"{f}/><path d="M10 7h4"/>' },
  // 計程車
  'taxi-front': { name: '計程車', tags: ['計程車', 'Uber'], body: '<path d="M4 18v-5l2-5h12l2 5v5Z"{f}/><path d="M4 13h16M6 18v2M18 18v2M9 8V5h6v3"/><circle cx="7.5" cy="15.5" r=".9"{F}/><circle cx="16.5" cy="15.5" r=".9"{F}/>' },
  'taxi-app': { name: '叫車', tags: ['計程車', 'Uber', '叫車'], body: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M12 6.5a3 3 0 0 0-3 3c0 2.3 3 4.5 3 4.5s3-2.2 3-4.5a3 3 0 0 0-3-3Z"{f}/><path d="M10.5 18.5h3"/>' },
  'taxi-sign': { name: '車頂燈', tags: ['計程車'], body: '<path d="M6 14l1.5-6h9L18 14Z"{f}/><path d="M3 14h18v4H3ZM10 11h4"/>' },
  // 加油
  'fuel-pump': { name: '加油機', tags: ['加油', '油錢'], body: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M4 10h10V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2Z"{f}/><path d="M3 21h12M14 8h2l3 3v7a1.5 1.5 0 0 1-3 0v-3h-2"/>' },
  'fuel-drop': { name: '油滴', tags: ['加油', '油錢'], body: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"{f}/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>' },
  'fuel-gauge': { name: '油表', tags: ['加油', '充電'], body: '<path d="M4 17a8 8 0 1 1 16 0"{f}/><path d="M12 17l4-5M6 13l1 .6M18 13l-1 .6M12 9v1.2"/><circle cx="12" cy="17" r="1.5"{F}/>' },
  // 停車
  'park-sign': { name: '停車標誌', tags: ['停車'], body: '<rect x="4" y="3" width="16" height="18" rx="3"{f}/><path d="M9.5 17V7h3.5a3 3 0 0 1 0 6H9.5"/>' },
  'park-meter': { name: '停車計時器', tags: ['停車', '路邊'], body: '<path d="M12 21v-7M9 21h6"/><rect x="7" y="3" width="10" height="11" rx="5"{f}/><path d="M12 6v3l2 1.5"/>' },
  'park-garage': { name: '停車場', tags: ['停車', '車庫'], body: '<path d="M3 21V9l9-5 9 5v12"/><path d="M7 21v-8h10v8Z"{f}/><path d="M7 16.5h10"/>' },
  // 購物
  'shop-bag': { name: '購物袋', tags: ['購物', '逛街'], body: '<path d="M5 8h14l-1 13H6Z"{f}/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>' },
  'shop-cart': { name: '購物車', tags: ['購物', '網購', '超市'], body: '<path d="M3 4h2l1.3 4"/><path d="M6.3 8H21l-2.1 6.6a1.5 1.5 0 0 1-1.4 1.1H8.9a1.5 1.5 0 0 1-1.5-1.2Z"{f}/><circle cx="9.5" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>' },
  'shop-tag': { name: '標籤', tags: ['購物', '特價'], body: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9Z"{f}/><circle cx="7.5" cy="7.5" r="1.5"/>' },
  // 日用品
  'daily-roll': { name: '衛生紙', tags: ['日用品', '衛生紙'], body: '<circle cx="8" cy="9" r="5"{f}/><circle cx="8" cy="9" r="1.6"/><path d="M8 4h9v13h-5v4H8"/>' },
  'daily-pump': { name: '洗手乳', tags: ['日用品', '清潔', '沐浴'], body: '<path d="M8 10h8v9a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2Z"{f}/><path d="M10 10V7h4v3M12 7V4h3M9.5 15h5"/>' },
  'daily-basket': { name: '提籃', tags: ['日用品', '雜貨'], body: '<path d="M3 10h18l-2 10H5Z"{f}/><path d="M7 10l3-6M17 10l-3-6M9 14v3M12 14v3M15 14v3"/>' },
  // 服飾
  'cloth-tshirt': { name: 'T 恤', tags: ['服飾', '衣服'], body: '<path d="M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0Z"{f}/>' },
  'cloth-dress': { name: '洋裝', tags: ['服飾', '衣服'], body: '<path d="M9 3h6l-1 5 5 13H5l5-13Z"{f}/><path d="M10 8h4"/>' },
  'cloth-hanger': { name: '衣架', tags: ['服飾', '洗衣'], body: '<path d="M10 5a2 2 0 1 1 2 2v1"/><path d="M12 8 3.5 14.8A1.5 1.5 0 0 0 4.4 17.5h15.2a1.5 1.5 0 0 0 .9-2.7Z"{f}/>' },
  // 3C
  'tech-phone': { name: '手機', tags: ['3C', '手機'], body: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"{f}/><path d="M10.5 18.5h3"/>' },
  'tech-laptop': { name: '筆電', tags: ['3C', '電腦'], body: '<rect x="4" y="5" width="16" height="10" rx="1.5"{f}/><path d="M2 19h20l-2-4H4Z"/>' },
  'tech-headphone': { name: '耳機', tags: ['3C', '耳機', '音樂'], body: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="5" height="7" rx="1.5"{f}/><rect x="16" y="14" width="5" height="7" rx="1.5"{f}/>' },
  // 居家
  'home-house': { name: '房子', tags: ['居家', '家'], body: '<path d="M3 11 12 4l9 7"/><path d="M5 9.5V20h14V9.5"{f}/><path d="M10 20v-5h4v5"/>' },
  'home-sofa': { name: '沙發', tags: ['居家', '家具'], body: '<path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M3 12a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v6H3Z"{f}/><path d="M5 18v2M19 18v2"/>' },
  'home-plant': { name: '盆栽', tags: ['居家', '植物'], body: '<path d="M6 14h12l-1.5 7h-9Z"{f}/><path d="M12 14V8M12 9c0-3 2-5 5-5 0 3-2 5-5 5ZM12 11c0-2.5-2-4-4.5-4 0 2.5 2 4 4.5 4Z"/>' },
  // 房租
  'rent-key': { name: '鑰匙', tags: ['房租', '租屋'], body: '<circle cx="8" cy="15" r="4.5"{f}/><path d="M11.2 11.8 20 3M17 6l2 2M15 8l2 2"/>' },
  'rent-building': { name: '公寓', tags: ['房租', '大樓', '管理費'], body: '<path d="M5 21V4h10v17"{f}/><path d="M15 9h4v12M3 21h18M8 7h1M11 7h1M8 10.5h1M11 10.5h1M8 14h1M11 14h1M9 21v-3h2v3"/>' },
  'rent-door': { name: '房門', tags: ['房租', '租屋'], body: '<path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"{f}/><path d="M3 21h18"/><circle cx="14.5" cy="12" r="1"{F}/>' },
  // 水電瓦斯
  'util-bulb': { name: '燈泡', tags: ['水電瓦斯', '電費'], body: '<path d="M12 3a6 6 0 0 0-3.5 10.9c.4.3.5.7.5 1.1v2h6v-2c0-.4.2-.8.5-1.1A6 6 0 0 0 12 3Z"{f}/><path d="M9 17h6M10 20.5h4"/>' },
  'util-faucet': { name: '水龍頭', tags: ['水電瓦斯', '水費'], body: '<path d="M3 8h10a5 5 0 0 1 5 5v1h-4v-1a1 1 0 0 0-1-1H3Z"{f}/><path d="M8 8V5M5.5 5h5M18 16.5s-1.6 1.8-1.6 2.8a1.6 1.6 0 0 0 3.2 0c0-1-1.6-2.8-1.6-2.8Z"/>' },
  'util-flame': { name: '瓦斯火', tags: ['水電瓦斯', '瓦斯費'], body: '<path d="M12 21a6 6 0 0 0 6-6c0-4-3-6-4-10-1.5 2-2.5 3-3 5-1-1-1.5-2-1.5-3C7 9 6 11.5 6 15a6 6 0 0 0 6 6Z"{f}/><path d="M12 21a2.5 2.5 0 0 1-2.5-2.5c0-2 2.5-4 2.5-4s2.5 2 2.5 4A2.5 2.5 0 0 1 12 21Z"/>' },
  // 網路電話
  'net-wifi': { name: 'Wi-Fi', tags: ['網路電話', '網路'], body: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1.4"{F}/>' },
  'net-router': { name: '路由器', tags: ['網路電話', '網路'], body: '<rect x="3" y="13" width="18" height="7" rx="2"{f}/><path d="M7 13V9M17 13V9M7 16.5h.01M10 16.5h.01M9.5 7a3.5 3.5 0 0 1 5 0M7.5 4.5a6.5 6.5 0 0 1 9 0"/>' },
  'net-signal': { name: '訊號', tags: ['網路電話', '電信', '手機費'], body: '<rect x="3" y="15" width="3" height="5" rx="1"{f}/><rect x="8" y="12" width="3" height="8" rx="1"{f}/><rect x="13" y="9" width="3" height="11" rx="1"{f}/><rect x="18" y="5" width="3" height="15" rx="1"{f}/>' },
  // 娛樂
  'fun-ticket': { name: '票券', tags: ['娛樂', '門票', '展覽'], body: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4Z"{f}/><path d="M15 7v10" stroke-dasharray="2 2.5"/>' },
  'fun-music': { name: '音符', tags: ['娛樂', '音樂', '唱歌'], body: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"{f}/><circle cx="17.5" cy="16" r="2.5"{f}/>' },
  'fun-party': { name: '拉炮', tags: ['娛樂', '派對'], body: '<path d="M4 20l4-11 7 7Z"{f}/><path d="M13 4c1 1 1 2 0 3M17 7h3M15 11c1.5-1 3-1 4.5 0M18 3v1"/>' },
  // 電影
  'movie-clapper': { name: '場記板', tags: ['電影'], body: '<path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"{f}/><path d="M4.4 9.3 3.6 6.4a1 1 0 0 1 .7-1.2L17.8 1.6a1 1 0 0 1 1.2.7l.6 2.3ZM8 4.4l2.6 3.4M13.2 3l2.6 3.4"/>' },
  'movie-popcorn': { name: '爆米花', tags: ['電影', '零食'], body: '<path d="M6 9l1.5 12h9L18 9Z"{f}/><path d="M10 9l.5 12M14 9l-.5 12M6 9a2.5 2.5 0 0 1 2-4 3 3 0 0 1 4-1.5A3 3 0 0 1 16 5a2.5 2.5 0 0 1 2 4"/>' },
  'movie-film': { name: '底片', tags: ['電影', '影片'], body: '<rect x="3" y="4" width="18" height="16" rx="2"{f}/><path d="M7 4v16M17 4v16M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4"/>' },
  // 遊戲
  'game-pad': { name: '手把', tags: ['遊戲', '電玩'], body: '<path d="M7 7h10a5 5 0 0 1 4.8 6.4l-1 3.3A2.5 2.5 0 0 1 16.4 18l-2-2.5H9.6l-2 2.5a2.5 2.5 0 0 1-4.4-1.3l-1-3.3A5 5 0 0 1 7 7Z"{f}/><path d="M8 10v3M6.5 11.5h3"/><circle cx="15.5" cy="10.5" r=".9"{F}/><circle cx="17" cy="12.8" r=".9"{F}/>' },
  'game-dice': { name: '骰子', tags: ['遊戲', '桌遊'], body: '<rect x="4" y="4" width="16" height="16" rx="3"{f}/><circle cx="8.5" cy="8.5" r="1.1"{F}/><circle cx="12" cy="12" r="1.1"{F}/><circle cx="15.5" cy="15.5" r="1.1"{F}/>' },
  'game-puzzle': { name: '拼圖', tags: ['遊戲', '玩具'], body: '<path d="M6 7h3a2 2 0 1 1 4 0h3v3.5a2 2 0 1 1 0 4V18h-3a2 2 0 1 0-4 0H6v-3.5a2 2 0 1 0 0-4Z"{f}/>' },
  // 旅遊
  'trip-plane': { name: '紙飛機', tags: ['旅遊', '機票'], body: '<path d="M21 4 3 11l7 2 2 7Z"{f}/><path d="M10 13l11-9"/>' },
  'trip-luggage': { name: '行李箱', tags: ['旅遊', '出差'], body: '<rect x="5" y="7" width="14" height="12" rx="2"{f}/><path d="M9 7V4h6v3M9 7v12M15 7v12M7 19v2M17 19v2"/>' },
  'trip-beach': { name: '海灘傘', tags: ['旅遊', '度假'], body: '<path d="M3 11a9 7 0 0 1 18 0Z"{f}/><path d="M12 11v9M7 20h10"/>' },
  // 訂閱
  'sub-tv': { name: '電視', tags: ['訂閱', '串流'], body: '<rect x="3" y="6" width="18" height="12" rx="2"{f}/><path d="M8 21h8M8 2l4 4 4-4"/>' },
  'sub-calendar': { name: '每月續訂', tags: ['訂閱', '週期'], body: '<rect x="3" y="5" width="18" height="16" rx="2"{f}/><path d="M3 10h18M8 3v4M16 3v4M15 15.5a3 3 0 1 1-.9-2.1M15 12.5V14h-1.5"/>' },
  'sub-bell': { name: '提醒', tags: ['訂閱', '通知'], body: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15Z"{f}/><path d="M10 21h4"/>' },
  // 影音
  'av-play': { name: '播放', tags: ['影音', 'Netflix', 'YouTube'], body: '<circle cx="12" cy="12" r="9"{f}/><path d="M10 8.5v7l5.5-3.5Z"/>' },
  'av-camera': { name: '攝影機', tags: ['影音', '直播'], body: '<rect x="3" y="7" width="12" height="10" rx="2"{f}/><path d="M15 10.5 21 7v10l-6-3.5"/>' },
  'av-mic': { name: '麥克風', tags: ['影音', 'Podcast', 'Spotify'], body: '<rect x="9" y="3" width="6" height="11" rx="3"{f}/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>' },
  // 雲端
  'cloud-solid': { name: '雲朵', tags: ['雲端', 'iCloud'], body: '<path d="M7 19a5 5 0 0 1-.6-10A6 6 0 0 1 18 9.5a4.5 4.5 0 0 1-.5 9.5Z"{f}/>' },
  'cloud-upload': { name: '上傳', tags: ['雲端', '備份'], body: '<path d="M7 18a5 5 0 0 1-.6-10A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1 0 9.5"/><path d="M12 21v-8M9 15.5l3-3 3 3"/>' },
  'cloud-db': { name: '儲存空間', tags: ['雲端', 'Google One', '容量'], body: '<ellipse cx="12" cy="6" rx="7" ry="3"{f}/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>' },
  // 軟體
  'sw-code': { name: '程式碼', tags: ['軟體', '開發'], body: '<rect x="3" y="4" width="18" height="16" rx="2"{f}/><path d="M9 10l-2.5 2.5L9 15M15 10l2.5 2.5L15 15M13 9l-2 7"/>' },
  'sw-apps': { name: 'App', tags: ['軟體', 'App'], body: '<rect x="4" y="4" width="7" height="7" rx="2"{f}/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"{f}/>' },
  'sw-window': { name: '視窗', tags: ['軟體', '電腦'], body: '<path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3Z"{f}/><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M13 12l7 3-3 1-1 3Z"{f}/>' },
  // 醫療
  'med-pill': { name: '膠囊', tags: ['醫療', '藥'], body: '<g transform="rotate(-45 12 12)"><rect x="3" y="8.5" width="18" height="7" rx="3.5"/><path d="M12 8.5H6.5a3.5 3.5 0 0 0 0 7H12Z"{f}/></g>' },
  'med-cross': { name: '十字', tags: ['醫療', '醫院', '診所'], body: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z"{f}/>' },
  'med-stetho': { name: '聽診器', tags: ['醫療', '看診'], body: '<path d="M6 3v5a5 5 0 0 0 10 0V3"/><path d="M11 13v2a4.5 4.5 0 0 0 9 0v-2"/><circle cx="20" cy="11" r="2"{f}/>' },
  // 教育
  'edu-book': { name: '書本', tags: ['教育', '書'], body: '<path d="M3 5a2 2 0 0 1 2-1h5a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H3Z"{f}/><path d="M21 5a2 2 0 0 0-2-1h-5a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7Z"/>' },
  'edu-cap': { name: '學士帽', tags: ['教育', '學費'], body: '<path d="M2 9l10-5 10 5-10 5Z"{f}/><path d="M6 11v5c2 2 10 2 12 0v-5M22 9v6"/>' },
  'edu-pencil': { name: '鉛筆', tags: ['教育', '文具', '補習'], body: '<path d="M4 20l1-5L16 4l4 4L9 19Z"{f}/><path d="M14 6l4 4M4 20l5-1"/>' },
  // 社交
  'social-chat': { name: '對話', tags: ['社交', '聊天'], body: '<path d="M4 5h16v11H9l-5 4Z"{f}/><path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01"/>' },
  'social-people': { name: '朋友', tags: ['社交', '朋友'], body: '<circle cx="9" cy="8" r="3.5"{f}/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>' },
  'social-heart': { name: '愛心', tags: ['社交', '約會', '交往'], body: '<path d="M12 20s-8-4.7-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.3 12 20 12 20Z"{f}/>' },
  // 聚餐
  'party-beer': { name: '啤酒', tags: ['聚餐', '喝酒'], body: '<path d="M4 7h8v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"{f}/><path d="M12 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M7 11v5M4 7c0-2 2-3 4-2 2-1 4 0 4 2"/>' },
  'party-wine': { name: '紅酒', tags: ['聚餐', '喝酒'], body: '<path d="M7 3h10v4a5 5 0 0 1-10 0Z"{f}/><path d="M12 12v8M8 21h8"/>' },
  'party-table': { name: '圓桌', tags: ['聚餐', '餐廳'], body: '<circle cx="12" cy="12" r="5"{f}/><circle cx="12" cy="3.5" r="1.5"/><circle cx="12" cy="20.5" r="1.5"/><circle cx="3.5" cy="12" r="1.5"/><circle cx="20.5" cy="12" r="1.5"/>' },
  // 禮物
  'gift-box': { name: '禮物盒', tags: ['禮物', '生日'], body: '<rect x="4" y="9" width="16" height="12" rx="1"{f}/><path d="M3 9h18v3H3ZM12 9v12M12 9c-1.5-3-5-4-5-1.5S11 9 12 9Zm0 0c1.5-3 5-4 5-1.5S13 9 12 9Z"/>' },
  'gift-bow': { name: '蝴蝶結', tags: ['禮物'], body: '<path d="M12 10C9 5 4 5 4 8s5 2 8 2Zm0 0c3-5 8-5 8-2s-5 2-8 2Z"{f}/><path d="M12 10l-4 10M12 10l4 10"/>' },
  'gift-card': { name: '禮物卡', tags: ['禮物', '禮券'], body: '<rect x="3" y="6" width="18" height="12" rx="2"{f}/><path d="M3 11h18M9 6v12M9 11c-2-3-5-2-4 0s4 0 4 0Zm0 0c2-3 5-2 4 0s-4 0-4 0Z"/>' },
  // 寵物
  'pet-paw': { name: '腳印', tags: ['寵物'], body: '<circle cx="12" cy="16" r="4"{f}/><circle cx="6" cy="11" r="2"/><circle cx="9.5" cy="6.5" r="2"/><circle cx="14.5" cy="6.5" r="2"/><circle cx="18" cy="11" r="2"/>' },
  'pet-bone': { name: '骨頭', tags: ['寵物', '飼料'], body: '<g transform="rotate(-45 12 12)"><path d="M7 10.5h10a2 2 0 1 1 2.5 1.5 2 2 0 1 1-2.5 1.5H7a2 2 0 1 1-2.5-1.5A2 2 0 1 1 7 10.5Z"{f}/></g>' },
  'pet-cat': { name: '貓臉', tags: ['寵物', '貓'], body: '<path d="M5 4l3 4h8l3-4v9a7 7 0 0 1-14 0Z"{f}/><path d="M9.5 12h.01M14.5 12h.01M11 15h2l-1 1Z"/>' },
  // 保險
  'ins-shield': { name: '盾牌', tags: ['保險'], body: '<path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6Z"{f}/><path d="M8.5 12l2.5 2.5 4.5-5"/>' },
  'ins-umbrella': { name: '雨傘', tags: ['保險', '保障'], body: '<path d="M3 12a9 9 0 0 1 18 0Z"{f}/><path d="M12 12v6a2 2 0 0 0 4 0"/>' },
  'ins-care': { name: '守護', tags: ['保險', '醫療險'], body: '<path d="M12 11s-4-2.4-4-5.2A2.3 2.3 0 0 1 12 4.5a2.3 2.3 0 0 1 4 1.3C16 8.6 12 11 12 11Z"{f}/><path d="M3 14h3l3 1.5h4a1.5 1.5 0 0 1 0 3H9M13 18.5l5-2.5a1.5 1.5 0 0 1 2 2l-6 4H3"/>' },
  // 其他
  'misc-box': { name: '紙箱', tags: ['其他', '包裹'], body: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5Z"{f}/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>' },
  'misc-dots': { name: '更多', tags: ['其他'], body: '<rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="7" cy="12" r="1.6"{F}/><circle cx="12" cy="12" r="1.6"{F}/><circle cx="17" cy="12" r="1.6"{F}/>' },
  'misc-star': { name: '星星', tags: ['其他', '收藏'], body: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8Z"{f}/>' },
  // 薪水
  'salary-wallet': { name: '錢包', tags: ['薪水', '收入'], body: '<path d="M16 7V4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5"{f}/><path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z"/>' },
  'salary-cash': { name: '鈔票', tags: ['薪水', '現金'], body: '<rect x="2.5" y="6" width="19" height="12" rx="2"{f}/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5h.01M18 14.5h.01"/>' },
  'salary-coins': { name: '硬幣', tags: ['薪水', '存錢'], body: '<ellipse cx="9" cy="7" rx="6" ry="2.5"{f}/><path d="M3 7v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V7M3 11v4c0 1.4 2.7 2.5 6 2.5"/><circle cx="16.5" cy="16.5" r="4.5"/><path d="M16.5 14.5v4"/>' },
  // 獎金
  'bonus-envelope': { name: '紅包', tags: ['獎金', '紅包', '年終'], body: '<rect x="5" y="3" width="14" height="18" rx="2"{f}/><path d="M5 8l7 4 7-4"/><circle cx="12" cy="12" r="1.8"/>' },
  'bonus-trophy': { name: '獎盃', tags: ['獎金', '比賽'], body: '<path d="M7 4h10v5a5 5 0 0 1-10 0Z"{f}/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 21h8M9 18h6"/>' },
  'bonus-sparkle': { name: '閃亮', tags: ['獎金', '意外之財', '中獎'], body: '<path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8Z"{f}/><path d="M18.5 14.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z"/>' },
  // 投資
  'invest-line': { name: '走勢', tags: ['投資', '股票'], body: '<path d="M6 16l4-5 3 3 6-7v11H6Z"{f}/><path d="M3 3v18h18M6 16l4-5 3 3 6-7M15 7h4v4"/>' },
  'invest-bars': { name: '長條', tags: ['投資', '報酬'], body: '<rect x="4" y="13" width="4" height="7" rx="1"{f}/><rect x="10" y="9" width="4" height="11" rx="1"{f}/><rect x="16" y="4" width="4" height="16" rx="1"{f}/>' },
  'invest-pie': { name: '配置', tags: ['投資', '基金', 'ETF'], body: '<path d="M12 3a9 9 0 1 0 9 9h-9Z"{f}/><path d="M15 3.5A9 9 0 0 1 20.5 9H15Z"/>' },
  // 兼職
  'job-briefcase': { name: '公事包', tags: ['兼職', '工作'], body: '<rect x="3" y="7" width="18" height="13" rx="2"{f}/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12h18"/>' },
  'job-clock': { name: '時薪', tags: ['兼職', '打工'], body: '<circle cx="12" cy="12" r="9"{f}/><path d="M12 7v5l3 2"/>' },
  'job-wrench': { name: '接案', tags: ['兼職', '維修', '接案'], body: '<path d="M14.5 4.2a5 5 0 0 0-4.8 6.9L4 16.8A2.2 2.2 0 0 0 7.2 20l5.7-5.7a5 5 0 0 0 6.9-4.8l-3 3-3.3-.8-.8-3.3Z"{f}/>' },
  // 退款
  'refund-arrow': { name: '退回', tags: ['退款'], body: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>' },
  'refund-receipt': { name: '收據', tags: ['退款', '發票'], body: '<path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5-2 1.5-2.5-1.5L5 21Z"{f}/><path d="M9 8h6M9 12h6"/>' },
  'refund-cycle': { name: '回流', tags: ['退款', '回饋'], body: '<path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v4h4"/><circle cx="12" cy="12" r="3.5"{f}/>' },
}

/** 預設分類 → 推薦的三個自繪圖示 */
export const CATEGORY_GLYPHS: Record<string, [string, string, string]> = {
  餐飲: ['meal-bowl', 'meal-cutlery', 'meal-cloche'],
  早餐: ['bf-toast', 'bf-egg', 'bf-mug'],
  午餐: ['lunch-bento', 'lunch-onigiri', 'lunch-burger'],
  晚餐: ['dinner-hotpot', 'dinner-ramen', 'dinner-skewer'],
  飲料: ['drink-boba', 'drink-juice', 'drink-coffee'],
  零食: ['snack-cookie', 'snack-candy', 'snack-icecream'],
  交通: ['transit-car', 'transit-scooter', 'transit-route'],
  捷運: ['mrt-train', 'mrt-card', 'mrt-sign'],
  公車: ['bus-front', 'bus-side', 'bus-stop'],
  計程車: ['taxi-front', 'taxi-app', 'taxi-sign'],
  加油: ['fuel-pump', 'fuel-drop', 'fuel-gauge'],
  停車: ['park-sign', 'park-meter', 'park-garage'],
  購物: ['shop-bag', 'shop-cart', 'shop-tag'],
  日用品: ['daily-roll', 'daily-pump', 'daily-basket'],
  服飾: ['cloth-tshirt', 'cloth-dress', 'cloth-hanger'],
  '3C': ['tech-phone', 'tech-laptop', 'tech-headphone'],
  居家: ['home-house', 'home-sofa', 'home-plant'],
  房租: ['rent-key', 'rent-building', 'rent-door'],
  水電瓦斯: ['util-bulb', 'util-faucet', 'util-flame'],
  網路電話: ['net-wifi', 'net-router', 'net-signal'],
  娛樂: ['fun-ticket', 'fun-music', 'fun-party'],
  電影: ['movie-clapper', 'movie-popcorn', 'movie-film'],
  遊戲: ['game-pad', 'game-dice', 'game-puzzle'],
  旅遊: ['trip-plane', 'trip-luggage', 'trip-beach'],
  訂閱: ['sub-tv', 'sub-calendar', 'sub-bell'],
  影音: ['av-play', 'av-camera', 'av-mic'],
  雲端: ['cloud-solid', 'cloud-upload', 'cloud-db'],
  軟體: ['sw-code', 'sw-apps', 'sw-window'],
  醫療: ['med-pill', 'med-cross', 'med-stetho'],
  教育: ['edu-book', 'edu-cap', 'edu-pencil'],
  社交: ['social-chat', 'social-people', 'social-heart'],
  聚餐: ['party-beer', 'party-wine', 'party-table'],
  禮物: ['gift-box', 'gift-bow', 'gift-card'],
  寵物: ['pet-paw', 'pet-bone', 'pet-cat'],
  保險: ['ins-shield', 'ins-umbrella', 'ins-care'],
  其他: ['misc-box', 'misc-dots', 'misc-star'],
  薪水: ['salary-wallet', 'salary-cash', 'salary-coins'],
  獎金: ['bonus-envelope', 'bonus-trophy', 'bonus-sparkle'],
  投資: ['invest-line', 'invest-bars', 'invest-pie'],
  兼職: ['job-briefcase', 'job-clock', 'job-wrench'],
  退款: ['refund-arrow', 'refund-receipt', 'refund-cycle'],
}

const FILL_SOFT = ' fill="currentColor" fill-opacity=".22"'
const FILL_SOLID = ' fill="currentColor" stroke="none"'

/** 回傳完整 <svg>，找不到時回傳空字串 */
export function glyphSvg(id: string): string {
  const g = GLYPHS[id]
  if (!g) return ''
  const body = g.body.replaceAll('{f}', FILL_SOFT).replaceAll('{F}', FILL_SOLID)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`
}
