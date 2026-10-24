// 第 4、5 款自繪圖示，規格同 glyphs.ts。

import type { Glyph } from './glyphs'

export const GLYPHS_EXTRA: Record<string, Glyph> = {
  // 餐飲
  'meal-plate': { name: '餐盤', tags: ['餐飲', '餐廳'], body: '<circle cx="12" cy="12" r="6"{f}/><circle cx="12" cy="12" r="3.5"/><path d="M3 4v4a1.5 1.5 0 0 0 3 0V4M4.5 9v11M21 4c-1.5 1-2 3-2 5v3h2v8"/>' },
  'meal-menu': { name: '菜單', tags: ['餐飲', '點餐'], body: '<rect x="5" y="3" width="14" height="18" rx="2"{f}/><path d="M9 8h6M9 12h6M9 16h3"/>' },
  // 早餐
  'bf-sandwich': { name: '三明治', tags: ['早餐', '三明治'], body: '<path d="M3 19 12 4l9 15Z"{f}/><path d="M5.5 15c1.5-1 2.5 1 4 0s2.5 1 4 0 2.5 1 4.5 0M8 11h8"/>' },
  'bf-pancake': { name: '鬆餅', tags: ['早餐', '鬆餅'], body: '<ellipse cx="12" cy="17" rx="8" ry="2.5"/><path d="M4 13.5c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5M4 10c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v7M4 10v7"/><ellipse cx="12" cy="10" rx="8" ry="2.5"{f}/><rect x="10.5" y="6" width="3" height="2.5" rx=".5"/>' },
  // 午餐
  'lunch-pizza': { name: '披薩', tags: ['午餐', '披薩'], body: '<path d="M4 6a24 24 0 0 1 16 0L12 21Z"{f}/><path d="M5.2 8.5a21 21 0 0 1 13.6 0"/><circle cx="10" cy="11" r="1"{F}/><circle cx="14" cy="13" r="1"{F}/><circle cx="12" cy="16.5" r="1"{F}/>' },
  'lunch-dumpling': { name: '水餃', tags: ['午餐', '水餃', '小吃'], body: '<path d="M3 15a9 8 0 0 1 18 0c0 2-2 3-4 3H7c-2 0-4-1-4-3Z"{f}/><path d="M8 9.5 9 12M12 8v3M16 9.5 15 12"/>' },
  // 晚餐
  'dinner-fish': { name: '魚', tags: ['晚餐', '海鮮'], body: '<path d="M3 12c3-4 7-6 11-5s5 3 5 5-1 4-5 5-8-1-11-5Z"{f}/><path d="M19 12l3-3v6Z"/><circle cx="7" cy="11" r=".9"{F}/>' },
  'dinner-wok': { name: '炒鍋', tags: ['晚餐', '熱炒', '自煮'], body: '<path d="M3 11h14a7 6 0 0 1-14 0Z"{f}/><path d="M17 11h5M8 7c-1-1.5 1-2 0-4M12 7c-1-1.5 1-2 0-4"/>' },
  // 飲料
  'drink-bottle': { name: '瓶裝水', tags: ['飲料', '水'], body: '<path d="M10 3h4v3l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3Z"/><path d="M8 12h8v4H8Z"{f}/>' },
  'drink-tea': { name: '茶壺', tags: ['飲料', '茶'], body: '<path d="M5 10h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5Z"{f}/><path d="M16 11.5h1.5a2.5 2.5 0 0 1 0 5H15M5 12 2.5 9.5M8 10a2.5 2.5 0 0 1 5 0M10.5 6.5V5"/>' },
  // 零食
  'snack-chips': { name: '洋芋片', tags: ['零食', '餅乾'], body: '<path d="M6 3h12l-1.5 3 1.5 3v9l-1.5 3h-9L6 18V9l1.5-3Z"{f}/><path d="M6 6h12M6 18h12"/><ellipse cx="12" cy="12" rx="2.8" ry="2"/>' },
  'snack-donut': { name: '甜甜圈', tags: ['零食', '甜點'], body: '<circle cx="12" cy="12" r="8.5"{f}/><circle cx="12" cy="12" r="2.8"/><path d="M8 8l1 .8M15 7l.6 1M17 13.5l1 .5M8 15.5l.5 1M12.5 17v1M6.5 12h1"/>' },
  // 交通
  'transit-bike': { name: '腳踏車', tags: ['交通', 'YouBike', '單車'], body: '<circle cx="6" cy="16" r="3.5"{f}/><circle cx="18" cy="16" r="3.5"{f}/><path d="M6 16l4-7h6l2 7M10 9 8.5 6H7M16 9l-4 7H6M15 6h2"/>' },
  'transit-signal': { name: '紅綠燈', tags: ['交通', '路口'], body: '<rect x="8" y="2.5" width="8" height="16" rx="3"{f}/><circle cx="12" cy="6.5" r="1.5"/><circle cx="12" cy="10.5" r="1.5"/><circle cx="12" cy="14.5" r="1.5"/><path d="M12 18.5V22"/>' },
  // 捷運
  'mrt-route': { name: '路線圖', tags: ['捷運', '轉乘'], body: '<path d="M7 6h3l2 4M12 14l2 4h3"/><circle cx="5" cy="6" r="2"{f}/><circle cx="19" cy="18" r="2"{f}/><circle cx="12" cy="12" r="2"{F}/>' },
  'mrt-hsr': { name: '高鐵', tags: ['捷運', '高鐵', '火車'], body: '<path d="M2 16V11a3 3 0 0 1 3-3h9c4 0 8 3 8 6v2Z"{f}/><path d="M2 16h20M6 11h3M12 11h3M5 19h3M14 19h3"/>' },
  // 公車
  'bus-coach': { name: '客運', tags: ['公車', '客運', '國道'], body: '<path d="M2 7a2 2 0 0 1 2-2h13l5 5v7H2Z"{f}/><path d="M2 11h20M6 5v6M10.5 5v6M15 5v6"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>' },
  'bus-coin': { name: '投幣', tags: ['公車', '車資'], body: '<rect x="4" y="11" width="16" height="10" rx="2"{f}/><path d="M9 14h6"/><circle cx="12" cy="6" r="3.5"/><path d="M12 4.5v3"/>' },
  // 計程車
  'taxi-meter': { name: '跳表', tags: ['計程車', '車資'], body: '<rect x="3" y="6" width="18" height="12" rx="2"{f}/><rect x="6" y="9" width="8" height="6" rx="1"/><path d="M17 10h.01M17 14h.01"/>' },
  'taxi-side': { name: '計程車側面', tags: ['計程車', 'Uber'], body: '<path d="M2 16v-3l3-1 2.5-4h8L19 12l3 1v3Z"{f}/><path d="M10 8V5.5h4V8M7.5 12h11"/><circle cx="7" cy="16.5" r="1.8"/><circle cx="17" cy="16.5" r="1.8"/>' },
  // 加油
  'fuel-can': { name: '油桶', tags: ['加油', '機油'], body: '<path d="M5 8l3-4h9a2 2 0 0 1 2 2v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z"{f}/><path d="M9 11l6 6M15 11l-6 6M12 4V2.5h3V4"/>' },
  'fuel-ev': { name: '充電', tags: ['加油', '充電', '電動車'], body: '<rect x="4" y="3" width="11" height="18" rx="2"{f}/><path d="M10.5 7 8 12h3l-1.5 4M15 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-2-2"/>' },
  // 停車
  'park-ticket': { name: '停車單', tags: ['停車', '停車費'], body: '<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21Z"{f}/><path d="M10 15V8h2.5a2 2 0 0 1 0 4H10"/>' },
  'park-cone': { name: '三角錐', tags: ['停車', '路邊'], body: '<path d="M9.5 4h5l4 15h-13Z"{f}/><path d="M3 19h18M8.3 9h7.4M7 14h10"/>' },
  // 購物
  'shop-store': { name: '商店', tags: ['購物', '超商', '店家'], body: '<path d="M4 10v10h16V10"/><path d="M3 5h18l-1 5a2.5 2.5 0 0 1-4.7 0 2.5 2.5 0 0 1-4.6 0 2.5 2.5 0 0 1-4.7 0Z"{f}/><path d="M10 20v-5h4v5"/>' },
  'shop-percent': { name: '折扣', tags: ['購物', '特價', '優惠'], body: '<path d="M12 2.5l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 21.5l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2Z"{f}/><path d="M9 15l6-6"/><circle cx="9.5" cy="9.5" r="1"/><circle cx="14.5" cy="14.5" r="1"/>' },
  // 日用品
  'daily-soap': { name: '肥皂', tags: ['日用品', '清潔', '沐浴'], body: '<rect x="3" y="11" width="15" height="9" rx="3"{f}/><circle cx="15" cy="6" r="2.5"/><circle cx="20" cy="9" r="1.5"/><circle cx="9" cy="6.5" r="1.5"/>' },
  'daily-trash': { name: '垃圾袋', tags: ['日用品', '清潔', '垃圾'], body: '<path d="M4 6h16M9 6V4h6v2"/><path d="M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14Z"{f}/><path d="M10 10v7M14 10v7"/>' },
  // 服飾
  'cloth-shoe': { name: '鞋子', tags: ['服飾', '鞋'], body: '<path d="M3 17V7h5l1.5 3c3 0 5 1 6.5 3l4 1a2 2 0 0 1 1 1.7V17Z"{f}/><path d="M3 17h19v2H3ZM9.5 10 8 12M12 11l-1.5 2"/>' },
  'cloth-pants': { name: '褲子', tags: ['服飾', '褲'], body: '<path d="M6 3h12l1.5 18h-5L12 10l-2.5 11h-5Z"{f}/><path d="M6 6.5h12"/>' },
  // 3C
  'tech-watch': { name: '手錶', tags: ['3C', '手錶', '穿戴'], body: '<rect x="6" y="6" width="12" height="12" rx="3"{f}/><path d="M9 6l.8-3.5h4.4L15 6M9 18l.8 3.5h4.4L15 18M12 9.5V12l1.5 1"/>' },
  'tech-camera': { name: '相機', tags: ['3C', '相機', '拍照'], body: '<path d="M3 8a2 2 0 0 1 2-2h2.5L9 4h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"{f}/><circle cx="12" cy="13" r="3.5"/>' },
  // 居家
  'home-bed': { name: '床', tags: ['居家', '家具', '寢具'], body: '<path d="M3 5v15M3 16h18v4M21 16v-3a3 3 0 0 0-3-3h-7v6"/><path d="M11 10h7a3 3 0 0 1 3 3v3H11Z"{f}/><circle cx="7" cy="12" r="2"/>' },
  'home-lamp': { name: '檯燈', tags: ['居家', '燈具'], body: '<path d="M8 3h8l3 8H5Z"{f}/><path d="M12 11v9M8 20h8"/>' },
  // 房租
  'rent-contract': { name: '租約', tags: ['房租', '合約'], body: '<path d="M5 3h10l4 4v14H5Z"{f}/><path d="M15 3v4h4M8 11h8M8 14.5h5M8 18c1-1.5 2 0 3-1s2 .5 3 0"/>' },
  'rent-sign': { name: '出租牌', tags: ['房租', '租屋'], body: '<path d="M4 3v18M4 6h14M8 6v3M15 6v3"/><rect x="6" y="9" width="12" height="8" rx="1.5"{f}/><path d="M10 13h4"/>' },
  // 水電瓦斯
  'util-bolt': { name: '閃電', tags: ['水電瓦斯', '電費'], body: '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"{f}/>' },
  'util-plug': { name: '插頭', tags: ['水電瓦斯', '電費', '插座'], body: '<path d="M9 2v5M15 2v5"/><path d="M6 7h12v4a6 6 0 0 1-12 0Z"{f}/><path d="M12 17v5"/>' },
  // 網路電話
  'net-phone': { name: '電話', tags: ['網路電話', '電話費'], body: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z"{f}/>' },
  'net-globe': { name: '地球', tags: ['網路電話', '網路', '國際'], body: '<circle cx="12" cy="12" r="9"{f}/><path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9Z"/>' },
  // 娛樂
  'fun-ferris': { name: '摩天輪', tags: ['娛樂', '遊樂園'], body: '<circle cx="12" cy="10" r="7"{f}/><path d="M12 10 7 21M12 10l5 11M5 21h14M12 3v14M5 10h14"/><circle cx="12" cy="10" r="1.5"/>' },
  'fun-balloon': { name: '氣球', tags: ['娛樂', '慶祝'], body: '<path d="M12 3a6 6 0 0 1 6 6c0 4-3.5 7-6 7s-6-3-6-7a6 6 0 0 1 6-6Z"{f}/><path d="M11 16l1 1.5 1-1.5M12 17.5c0 2-2 2-1 4.5"/>' },
  // 電影
  'movie-3d': { name: '3D 眼鏡', tags: ['電影', '影城'], body: '<path d="M2 9h20v6a2 2 0 0 1-2 2h-4l-2-3h-4l-2 3H4a2 2 0 0 1-2-2Z"{f}/><path d="M2 9l2-4M22 9l-2-4M12 9v5"/>' },
  'movie-screen': { name: '銀幕', tags: ['電影', '影城'], body: '<path d="M3 4h18v10H3Z"{f}/><path d="M5 18h3M10.5 18h3M16 18h3M5 21h3M10.5 21h3M16 21h3"/>' },
  // 遊戲
  'game-joystick': { name: '搖桿', tags: ['遊戲', '電玩', '大型電玩'], body: '<path d="M4 16h16v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"{f}/><path d="M12 16V9"/><circle cx="12" cy="6" r="3"{f}/><path d="M16.5 16v-1.5"/>' },
  'game-cards': { name: '撲克牌', tags: ['遊戲', '桌遊', '卡牌'], body: '<rect x="3" y="6" width="11" height="15" rx="1.5" transform="rotate(-10 8.5 13.5)"/><rect x="10" y="4" width="11" height="15" rx="1.5"{f}/><path d="M15.5 9.5c-1.2-1.2-3 .3-1.8 1.8l1.8 1.7 1.8-1.7c1.2-1.5-.6-3-1.8-1.8Z"/>' },
  // 旅遊
  'trip-map': { name: '地圖', tags: ['旅遊', '行程'], body: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2Z"{f}/><path d="M9 4v14M15 6v14"/>' },
  'trip-mountain': { name: '山', tags: ['旅遊', '登山', '露營'], body: '<path d="M2 20 9 7l4 7 2-3 7 9Z"{f}/><path d="M7.5 10 9 11.5 10.5 10"/><circle cx="18" cy="5" r="2"/>' },
  // 訂閱
  'sub-repeat': { name: '循環', tags: ['訂閱', '週期', '自動續訂'], body: '<path d="M4 11V9a3 3 0 0 1 3-3h13M17 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H4M7 21l-3-3 3-3"/><circle cx="12" cy="12" r="2.5"{f}/>' },
  'sub-crown': { name: '會員', tags: ['訂閱', 'VIP', '會員'], body: '<path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5Z"{f}/><path d="M5 19h14"/>' },
  // 影音
  'av-radio': { name: '收音機', tags: ['影音', '廣播', 'Podcast'], body: '<rect x="3" y="8" width="18" height="12" rx="2"{f}/><path d="M7 8l9-5"/><circle cx="15.5" cy="14" r="3"/><path d="M6 12h4M6 15h4M6 18h4"/>' },
  'av-playlist': { name: '歌單', tags: ['影音', '音樂', 'Spotify'], body: '<path d="M3 6h12M3 11h12M3 16h7"/><path d="M14 14.5v6l5.5-3Z"{f}/>' },
  // 雲端
  'cloud-sync': { name: '同步', tags: ['雲端', '同步'], body: '<path d="M7 18a5 5 0 0 1-.6-10A6 6 0 0 1 18 8.5a4.5 4.5 0 0 1 0 9.5"{f}/><path d="M9 14a3 3 0 0 1 5.2-2M15 15a3 3 0 0 1-5.2 2M14.5 10v2h-2M9.5 19v-2h2"/>' },
  'cloud-lock': { name: '雲端加密', tags: ['雲端', 'VPN', '密碼'], body: '<path d="M7 17a5 5 0 0 1-.6-10A6 6 0 0 1 18 7.5a4.5 4.5 0 0 1 .5 9"/><rect x="9" y="13" width="7" height="7" rx="1.5"{f}/><path d="M10.5 13v-1.5a2 2 0 0 1 4 0V13"/>' },
  // 軟體
  'sw-gear': { name: '齒輪', tags: ['軟體', '工具', '設定'], body: '<path d="M10.3 3h3.4l.6 2.4 1.8 1 2.4-.7 1.7 3-1.8 1.7v2.2l1.8 1.7-1.7 3-2.4-.7-1.8 1-.6 2.4h-3.4l-.6-2.4-1.8-1-2.4.7-1.7-3 1.8-1.7v-2.2L3.6 8.7l1.7-3 2.4.7 1.8-1Z"{f}/><circle cx="12" cy="12" r="3"/>' },
  'sw-terminal': { name: '終端機', tags: ['軟體', '開發', '主機'], body: '<rect x="3" y="4" width="18" height="16" rx="2"{f}/><path d="M7 9l3 3-3 3M12 15h5"/>' },
  // 醫療
  'med-tooth': { name: '牙齒', tags: ['醫療', '牙醫'], body: '<path d="M7 3c-3 0-4 3-3.5 6 .4 2.4 1.5 3.5 2 6s.5 6 2.5 6 2-4 4-4 2 4 4 4 2-3.5 2.5-6 1.6-3.6 2-6C21 6 20 3 17 3c-2 0-3 1-5 1S9 3 7 3Z"{f}/>' },
  'med-bandage': { name: 'OK 繃', tags: ['醫療', '藥局', '外傷'], body: '<rect x="2" y="8" width="20" height="8" rx="4" transform="rotate(-45 12 12)"{f}/><rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(-45 12 12)"/><path d="M11 11h.01M13 13h.01"/>' },
  // 教育
  'edu-school': { name: '學校', tags: ['教育', '學費'], body: '<path d="M3 21V11l9-5 9 5v10"/><path d="M5 10v11h14V10l-7-4Z"{f}/><path d="M10 21v-5h4v5M12 6V2l3 1-3 1"/>' },
  'edu-abc': { name: '字母方塊', tags: ['教育', '語言', '補習'], body: '<rect x="3" y="11" width="9" height="9" rx="1.5"{f}/><rect x="12" y="11" width="9" height="9" rx="1.5"/><rect x="7.5" y="2" width="9" height="9" rx="1.5"/><path d="M10 9l2-4.5L14 9M10.8 7.3h2.4M5.5 18v-4.5h1.5a1.1 1.1 0 0 1 0 2.2H5.5h2a1.1 1.1 0 0 1 0 2.3Z"/>' },
  // 社交
  'social-mail': { name: '信封', tags: ['社交', '邀請', '卡片'], body: '<rect x="3" y="5" width="18" height="14" rx="2"{f}/><path d="M3 7l9 6 9-6"/>' },
  'social-smile': { name: '笑臉', tags: ['社交', '朋友'], body: '<circle cx="12" cy="12" r="9"{f}/><path d="M8.5 14.5a4 4 0 0 0 7 0M9 10h.01M15 10h.01"/>' },
  // 聚餐
  'party-cake': { name: '蛋糕', tags: ['聚餐', '生日', '甜點'], body: '<path d="M4 12h16v8H4Z"{f}/><path d="M4 15c1.5 1 2.5 1 4 0s2.5-1 4 0 2.5 1 4 0 2.5-1 4 0M3 20h18M8 12V9M12 12V9M16 12V9M8 6.5v.01M12 6.5v.01M16 6.5v.01"/>' },
  'party-cheers': { name: '乾杯', tags: ['聚餐', '喝酒', '慶祝'], body: '<path d="M4 5l5-1.5 1.5 5a3 3 0 0 1-5 1.5Z"{f}/><path d="M20 5l-5-1.5-1.5 5a3 3 0 0 0 5 1.5Z"{f}/><path d="M7.5 11l1.5 6M6.5 18l4-1M16.5 11 15 17M17.5 18l-4-1M12 2v2"/>' },
  // 禮物
  'gift-flower': { name: '花束', tags: ['禮物', '花', '情人節'], body: '<path d="M7 12h10l-4 9h-2Z"{f}/><circle cx="12" cy="6" r="2.5"/><circle cx="7.5" cy="8" r="2.5"/><circle cx="16.5" cy="8" r="2.5"/><path d="M12 8.5V12"/>' },
  'gift-tag': { name: '禮物吊牌', tags: ['禮物', '紀念日'], body: '<path d="M10 3h9a2 2 0 0 1 2 2v9l-9 7-9-7V10Z"/><path d="M12 15s-3.5-2-3.5-4.2a1.8 1.8 0 0 1 3.5-.6 1.8 1.8 0 0 1 3.5.6C15.5 13 12 15 12 15Z"{f}/><circle cx="17" cy="7" r="1"/>' },
  // 寵物
  'pet-dog': { name: '狗臉', tags: ['寵物', '狗'], body: '<path d="M8 6h8a3 3 0 0 1 3 3v5a7 7 0 0 1-14 0V9a3 3 0 0 1 3-3Z"{f}/><path d="M8 6C5 5 3 7 3 10s1 4 2.5 4M16 6c3-1 5 1 5 4s-1 4-2.5 4M10 11h.01M14 11h.01M12 15.5V17"/><path d="M11 14h2l-1 1.2Z"{F}/>' },
  'pet-fish': { name: '魚缸', tags: ['寵物', '魚', '水族'], body: '<path d="M5 6h14v1a8 8 0 1 1-14 0Z"{f}/><path d="M9 13c1.5-2 4-2 5 0-1 2-3.5 2-5 0ZM14 13l2-1.5v3Z"/><path d="M8 3.5h8"/>' },
  // 保險
  'ins-lifebuoy': { name: '救生圈', tags: ['保險', '意外險'], body: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.6 3.6M18.4 5.6l-3.6 3.6M5.6 18.4l3.6-3.6M18.4 18.4l-3.6-3.6"/><path d="M12 3a9 9 0 0 1 6.4 2.6l-3.6 3.6A4 4 0 0 0 12 8a4 4 0 0 0-2.8 1.2L5.6 5.6A9 9 0 0 1 12 3Z"{f}/>' },
  'ins-doc': { name: '保單', tags: ['保險', '保單'], body: '<path d="M5 3h10l4 4v14H5Z"/><path d="M12 9l-4 1.5V13c0 2 1.7 3.5 4 4.2 2.3-.7 4-2.2 4-4.2v-2.5Z"{f}/><path d="M15 3v4h4"/>' },
  // 其他
  'misc-question': { name: '問號', tags: ['其他', '雜項'], body: '<circle cx="12" cy="12" r="9"{f}/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>' },
  'misc-grid': { name: '格子', tags: ['其他'], body: '<rect x="4" y="4" width="7" height="7" rx="1.5"{f}/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>' },
  // 薪水
  'salary-bank': { name: '銀行', tags: ['薪水', '銀行', '轉帳'], body: '<path d="M3 9 12 4l9 5Z"{f}/><path d="M3 9h18M5 9v8M9.5 9v8M14.5 9v8M19 9v8M3 17h18M2 20h20"/>' },
  'salary-payday': { name: '發薪日', tags: ['薪水', '入帳'], body: '<rect x="3" y="5" width="18" height="16" rx="2"{f}/><path d="M3 10h18M8 3v4M16 3v4M13.5 13h-2a1.2 1.2 0 0 0 0 2.4h1a1.2 1.2 0 0 1 0 2.4h-2M12 12v1M12 17.8v1"/>' },
  // 獎金
  'bonus-medal': { name: '獎牌', tags: ['獎金', '績效'], body: '<path d="M7 3h4l2 6M17 3h-4l-2 6"/><circle cx="12" cy="15" r="6"{f}/><path d="M12 12.5l.8 1.6 1.7.2-1.3 1.2.3 1.8-1.5-.9-1.5.9.3-1.8-1.3-1.2 1.7-.2Z"/>' },
  'bonus-gem': { name: '鑽石', tags: ['獎金', '年終', '大獎'], body: '<path d="M7 4h10l4 5-9 11L3 9Z"{f}/><path d="M3 9h18M9 4 8 9l4 11 4-11-1-5"/>' },
  // 投資
  'invest-candles': { name: 'K 線', tags: ['投資', '股票', '加密貨幣'], body: '<path d="M6 3v4M6 15v3M12 6v2M12 18v3M18 4v3M18 13v4"/><rect x="4" y="7" width="4" height="8" rx="1"{f}/><rect x="10" y="8" width="4" height="10" rx="1"/><rect x="16" y="7" width="4" height="6" rx="1"{f}/>' },
  'invest-coin-up': { name: '增值', tags: ['投資', '利息', '股利'], body: '<circle cx="9" cy="14" r="6"{f}/><path d="M9 11v6M7 12.5h3a1 1 0 0 1 0 2H8a1 1 0 0 0 0 2h3M14 4h6v6M20 4l-6 6"/>' },
  // 兼職
  'job-badge': { name: '識別證', tags: ['兼職', '工作', '上班'], body: '<rect x="5" y="5" width="14" height="16" rx="2"{f}/><path d="M10 2h4v5h-4ZM9 17h6"/><circle cx="12" cy="12" r="2.5"/>' },
  'job-shift': { name: '班表', tags: ['兼職', '打工', '排班'], body: '<rect x="3" y="5" width="18" height="16" rx="2"{f}/><path d="M3 10h18M8 3v4M16 3v4M8.5 15l2 2 4-4"/>' },
  // 退款
  'refund-coin': { name: '退錢', tags: ['退款', '退費'], body: '<circle cx="14" cy="13" r="7"{f}/><path d="M14 10v6M12 11.5h3a1 1 0 0 1 0 2h-2a1 1 0 0 0 0 2h3M6 5 2 9l4 4M2 9h5"/>' },
  'refund-box': { name: '退貨', tags: ['退款', '退貨'], body: '<path d="M3 8l9-4.5L21 8v9l-9 4.5L3 17Z"{f}/><path d="M3 8l9 4.5L21 8M12 12.5v9M7.5 5.8l9 4.5"/>' },
}

/** 預設分類 → 第 4、5 款 */
export const CATEGORY_GLYPHS_EXTRA: Record<string, [string, string]> = {
  餐飲: ['meal-plate', 'meal-menu'],
  早餐: ['bf-sandwich', 'bf-pancake'],
  午餐: ['lunch-pizza', 'lunch-dumpling'],
  晚餐: ['dinner-fish', 'dinner-wok'],
  飲料: ['drink-bottle', 'drink-tea'],
  零食: ['snack-chips', 'snack-donut'],
  交通: ['transit-bike', 'transit-signal'],
  捷運: ['mrt-route', 'mrt-hsr'],
  公車: ['bus-coach', 'bus-coin'],
  計程車: ['taxi-meter', 'taxi-side'],
  加油: ['fuel-can', 'fuel-ev'],
  停車: ['park-ticket', 'park-cone'],
  購物: ['shop-store', 'shop-percent'],
  日用品: ['daily-soap', 'daily-trash'],
  服飾: ['cloth-shoe', 'cloth-pants'],
  '3C': ['tech-watch', 'tech-camera'],
  居家: ['home-bed', 'home-lamp'],
  房租: ['rent-contract', 'rent-sign'],
  水電瓦斯: ['util-bolt', 'util-plug'],
  網路電話: ['net-phone', 'net-globe'],
  娛樂: ['fun-ferris', 'fun-balloon'],
  電影: ['movie-3d', 'movie-screen'],
  遊戲: ['game-joystick', 'game-cards'],
  旅遊: ['trip-map', 'trip-mountain'],
  訂閱: ['sub-repeat', 'sub-crown'],
  影音: ['av-radio', 'av-playlist'],
  雲端: ['cloud-sync', 'cloud-lock'],
  軟體: ['sw-gear', 'sw-terminal'],
  醫療: ['med-tooth', 'med-bandage'],
  教育: ['edu-school', 'edu-abc'],
  社交: ['social-mail', 'social-smile'],
  聚餐: ['party-cake', 'party-cheers'],
  禮物: ['gift-flower', 'gift-tag'],
  寵物: ['pet-dog', 'pet-fish'],
  保險: ['ins-lifebuoy', 'ins-doc'],
  其他: ['misc-question', 'misc-grid'],
  薪水: ['salary-bank', 'salary-payday'],
  獎金: ['bonus-medal', 'bonus-gem'],
  投資: ['invest-candles', 'invest-coin-up'],
  兼職: ['job-badge', 'job-shift'],
  退款: ['refund-coin', 'refund-box'],
}
