import { Card } from './types';

export const ASSETS = {
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbdoIxp_Cnk7hU5w0DX4ZH_TSG_MByPvwQyeIP58d1q89JJOw8ze26_JmPuIdS3ImrcV1bDUfNg01DYsW5biuiu-2y37bxw6w5ULCET2XIgG23uctjIEa-v-_A1u5CDQP5tGJaREtDq4BmfaYANOMTojgGR-bywm3I3DB4DKEsP9o8SfAXElwDlQqtGy8dAr6lmJk8rMwLBkWdapJY8-KYbTB47OUvTArd-1wwARK7eyiGltZw7Zpei7D9kH4sJN6W8xc7cDJQPE0',
  floatingLeft: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNVSMgHEb6RYCMoKGLGs35GAkxKOI_4MWDYaHl1trE-ZCoPW8wWQwutDYtofISddph9GUsfLlp4XvPrasdj7sVJvpIAa67R-b2tkhi37l2-86Ch723xvMrtRm_nWeB02bEkY6KIPaD6OcHa2QkjVf_UMIlL7mqkpO5iuWHaN0Zz43CQS2UsuSkD2Ar41jp8pLZUq8wZLvrBcXruiCWvswjH7TDAvpl5of9zcFj5YOvq0UcYz9wDZGtAJUoXsbPp5mNnRz0AuI64zw',
  floatingRight: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3HwiIBQ6Gfy9CcVwAfPJMbYXLeo6F8ae1Si-tpGd9WMXhPciui-3AL6eKGTIaR-0286T4vVivIf-Sb8G8rtIUBJnMaPevdHcqo4LpkTrlolFCNDNqoHCFYFRlxhTQQF5iKYcl58LztEtJeMXTswntEcxLUJwnemjk0S9PDyTdYpuwvJZcZRn-c8DVaNu7jBimxDZYe-9TkDARoiMFGwj50JaPrl4FDC0eWfYB6aAQxDqb_4nqmSQHjhu7j6NCH_dHYRCoAD3kU_U',
  dashboardBg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbxYIs6M_G5HTT_62bLdfozDBgAUrvyGkIDz7ExRcbQzlARTIe0AyIfPCicnEgkeBTl_GsQE_MkurhFZQEQyxCCSghzH8SexETENBXoom_9OhmJEjp7z7rFcsswDz2g14AhaoaQAanL_aygRLP03PjBhfNc3DcqBSYhjdxGc5TCHrxzAo2xUAgXoZs4QY3zJQgbpmZUkrwdBbxX8edMdTSo7_eMQLfh4n5irxAPdsyDyG_lV_QCX5aoEN_Gr6zcSvKz-OZnB-eaDw'
};

export const INITIAL_CARDS: Card[] = [
  {
    id: '1',
    name: 'Sheoldred, the Apocalypse',
    price: 78.50,
    quantity: 2,
    rarity: 'Mythic',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDawOsaRePqQZCv5SYRu6oaT9C-gH0m58WsMoh38KKJ6IwefvUCrN3dXkDL1q52fsik8y0PNl82qgXALHuwcb1suo1pZtqPO4kNAoV6YCTdDY-PltWXLZbke8z9sxtCxG6aeUt2t9f1FAiZzYrTpArqImUbhSXFnBxFEhHSsBf5zXhWwjgklCfW6eNDSKWZxCpQHvC74-vZGQ5cWjIqvA6nSZOLshgt_OmFuE_AWNArJH3D6rBEweZ5w_GuiRGzlAb9IH0PesXWbjs',
    setName: 'Dominaria United',
    collectorNumber: '107',
    foil: false,
    lang: 'EN',
    notes: 'Impecable, guardada en folio doble KMC',
    usdPriceHistory: [
      { date: '10 Jun', value: 74.20 },
      { date: '15 Jun', value: 75.00 },
      { date: '20 Jun', value: 76.50 },
      { date: '25 Jun', value: 77.80 },
      { date: '30 Jun', value: 78.50 }
    ]
  },
  {
    id: '2',
    name: 'Ragavan, Nimble Pilferer',
    price: 42.25,
    quantity: 4,
    rarity: 'Mythic',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABpGbYGREv6SDnVhLMUgXYxFSfg2zXwNcAHzGPQWjpb77sbIDr7WNC9XQLKfWJ3jDR65gE_pQD65W4EJ5CBt6KBwyndBMZv7RtB_t2CSyIFoOmI4BhVRjt2OnUVzFSDCwdyPRSwusf2JQILeExkGFsBU6qx1cUzaZarGAI4osrpOkB2ZQrjcVpIeV7AEz1Y3t3ZMP3sQuyxkK3bI_vfbX6t5e5Ld7IXeq-ckRKygautWwLVSoOe7GkDwSrI2R3lVr8LW7FMiShsVY',
    setName: 'Modern Horizons 2',
    collectorNumber: '138',
    foil: true,
    lang: 'EN',
    notes: 'Foil tradicional, sin pringles',
    usdPriceHistory: [
      { date: '10 Jun', value: 45.00 },
      { date: '15 Jun', value: 44.10 },
      { date: '20 Jun', value: 43.00 },
      { date: '25 Jun', value: 42.80 },
      { date: '30 Jun', value: 42.25 }
    ]
  },
  {
    id: '3',
    name: 'Orcish Bowmasters',
    price: 35.90,
    quantity: 3,
    rarity: 'Rare',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPRSNHVzL4Qi54L-_di5fC7159rdUiYEOXqZ5ibDCQacQQhff9Bb8OEqy0xSE9_9haonKLnjPoppq3gEIJwPUnhU9eLxhssuYwnC6QT4me0BuJu3CFlg0iIUycUZYvBW3ahvpbYNkZQJE_aY49fSWkA1aF_3-jFzGAJsqO5S0T40UVOCOoNJ599ctO7Ifmaqem5pO-r9Fo-z5M6hDj4-ERATSweuQzJ5NxZhw57FSoPCzVlBt1Yql5swxSOgC_UfMFy3a-BC81L9c',
    setName: 'The Lord of the Rings: Tales of Middle-earth',
    collectorNumber: '103',
    foil: false,
    lang: 'EN',
    notes: 'Dos copias en mazo de Commander, una para trade',
    usdPriceHistory: [
      { date: '10 Jun', value: 32.10 },
      { date: '15 Jun', value: 33.50 },
      { date: '20 Jun', value: 34.20 },
      { date: '25 Jun', value: 35.00 },
      { date: '30 Jun', value: 35.90 }
    ]
  },
  {
    id: '4',
    name: 'The One Ring',
    price: 92.15,
    quantity: 1,
    rarity: 'Mythic',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3LVCxp5KqkCbZwsqNFRoweTIItwmtQM-WJPGG8i1ZGgWx7Vg5cX6HMMCEpYAgaSiqrhm3aWZ2rOXCS1Y_os8br4Wa6FHJLYqP7oYi6YPqh1sVrez0RCsSPhOMFhnMN9wt2hMSg2e8yq-m7Oi9gLxSyEJ3rgopXL4zyaFar0RfFu7LvN3iLxmdjhbRLe_MejiB_L-qli-0-TlD21TbDg9bBh-ulKRh_M2YysxxRK29f9DY7UQQhWESpXEi2X4xeTgcrcZ8ydxFQwE',
    setName: 'The Lord of the Rings: Tales of Middle-earth',
    collectorNumber: '246',
    foil: false,
    lang: 'EN',
    notes: 'Edición Regular, excelente estado (Near Mint)',
    usdPriceHistory: [
      { date: '10 Jun', value: 88.00 },
      { date: '15 Jun', value: 89.50 },
      { date: '20 Jun', value: 91.00 },
      { date: '25 Jun', value: 91.80 },
      { date: '30 Jun', value: 92.15 }
    ]
  },
  {
    id: '5',
    name: 'Gold-Span Dragon',
    price: 22.40,
    quantity: 1,
    rarity: 'Mythic',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6Tout1KfU2538JPP-uDKkALxIQnFZbPIxNEYpb6GQOwBhZ22H-jJA6F9dghVo6Za7PjT2Nig2qex6KwzaOhvVze3Ut8O1E0LqFpGrsOrK6pn_jRGCEbA5nGTBc5upksdmPKsVjXO4XZmbqy7LOYmbccQEm3moh7KQgmcslsylaKNWku_6eAhLjJwG_m2c2P-Iu_pGtPB0H1VhbpDU4sd0KnI82tU-sgCxgb2Iv-PtMW-CnTYAeGOJdpcsMuTMhXstz2lpsgQksCs',
    setName: 'Kaldheim',
    collectorNumber: '139',
    foil: false,
    lang: 'ES',
    notes: 'Idioma español. Conservada impecable.',
    usdPriceHistory: [
      { date: '10 Jun', value: 24.50 },
      { date: '15 Jun', value: 23.80 },
      { date: '20 Jun', value: 23.10 },
      { date: '25 Jun', value: 22.90 },
      { date: '30 Jun', value: 22.40 }
    ]
  },
  {
    id: '6',
    name: 'Atraxa, Grand Unifier',
    price: 18.25,
    quantity: 3,
    rarity: 'Mythic',
    imageUrl: 'https://images.scryfall.com/cards/normal/front/d/0/d0ad2464-13e7-4d7d-a9d3-0d72c42feefe.jpg',
    setName: 'Phyrexia: All Will Be One',
    collectorNumber: '196',
    foil: false,
    lang: 'EN',
    notes: 'NM. Clave en Standard y Pioneer reanimator',
    usdPriceHistory: [
      { date: '10 Jun', value: 16.00 },
      { date: '15 Jun', value: 17.20 },
      { date: '20 Jun', value: 17.80 },
      { date: '25 Jun', value: 18.00 },
      { date: '30 Jun', value: 18.25 }
    ]
  },
  {
    id: '7',
    name: 'Mana Crypt',
    price: 185.00,
    quantity: 1,
    rarity: 'Mythic',
    imageUrl: 'https://images.scryfall.com/cards/normal/front/4/d/4d960186-4559-4af0-bd22-63bac15f8911.jpg',
    setName: 'Double Masters',
    collectorNumber: '230',
    foil: false,
    lang: 'EN',
    notes: 'Ultra rara, guardada bajo llave',
    usdPriceHistory: [
      { date: '10 Jun', value: 195.00 },
      { date: '15 Jun', value: 190.00 },
      { date: '20 Jun', value: 188.00 },
      { date: '25 Jun', value: 186.00 },
      { date: '30 Jun', value: 185.00 }
    ]
  },
  {
    id: '8',
    name: 'Sol Ring',
    price: 1.80,
    quantity: 12,
    rarity: 'Common',
    imageUrl: 'https://images.scryfall.com/cards/normal/front/c/c/cc40323f-a124-4054-93be-ef984f475df8.jpg',
    setName: 'Commander Masters',
    collectorNumber: '381',
    foil: false,
    lang: 'EN',
    notes: 'Copias de sobra para Commander',
    usdPriceHistory: [
      { date: '10 Jun', value: 1.80 },
      { date: '15 Jun', value: 1.80 },
      { date: '20 Jun', value: 1.80 },
      { date: '25 Jun', value: 1.80 },
      { date: '30 Jun', value: 1.80 }
    ]
  }
];

export const SEARCHABLE_DATABASE: Card[] = [
  ...INITIAL_CARDS,
  {
    id: 'db-1',
    name: 'Black Lotus',
    price: 25000.00,
    quantity: 0,
    rarity: 'Mythic',
    imageUrl: 'https://images.scryfall.com/cards/normal/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
    setName: 'Alpha Edition',
    collectorNumber: '232',
    foil: false,
    lang: 'EN',
    notes: 'El Santo Grial de Magic.'
  },
  {
    id: 'db-2',
    name: 'Mox Emerald',
    price: 6500.00,
    quantity: 0,
    rarity: 'Mythic',
    imageUrl: 'https://images.scryfall.com/cards/normal/front/a/c/aced2c55-7543-4076-bcdd-36c4d649b8ee.jpg',
    setName: 'Beta Edition',
    collectorNumber: '261',
    foil: false,
    lang: 'EN'
  },
  {
    id: 'db-3',
    name: 'Mox Jet',
    price: 7200.00,
    quantity: 0,
    rarity: 'Mythic',
    imageUrl: 'https://images.scryfall.com/cards/normal/front/5/f/5f6927e1-c580-483a-8e2a-6e2deb74800e.jpg',
    setName: 'Unlimited Edition',
    collectorNumber: '263',
    foil: false,
    lang: 'EN'
  },
  {
    id: 'db-4',
    name: 'Jace, the Mind Sculptor',
    price: 34.50,
    quantity: 0,
    rarity: 'Mythic',
    imageUrl: 'https://images.scryfall.com/cards/normal/front/c/8/c8817585-0d30-415e-9a46-af710e08c610.jpg',
    setName: 'Worldwake',
    collectorNumber: '31',
    foil: false,
    lang: 'EN'
  },
  {
    id: 'db-5',
    name: 'Tarmogoyf',
    price: 14.99,
    quantity: 0,
    rarity: 'Rare',
    imageUrl: 'https://images.scryfall.com/cards/normal/front/c/c/ccb32236-11f0-464a-959c-85153284cd78.jpg',
    setName: 'Future Sight',
    collectorNumber: '153',
    foil: false,
    lang: 'EN'
  },
  {
    id: 'db-6',
    name: 'Force of Will',
    price: 68.00,
    quantity: 0,
    rarity: 'Mythic',
    imageUrl: 'https://images.scryfall.com/cards/normal/front/8/9/89f610d9-b15b-4873-a120-bb60759f2f81.jpg',
    setName: 'Alliances',
    collectorNumber: '42',
    foil: false,
    lang: 'EN'
  },
  {
    id: 'db-7',
    name: 'Wrenn and Six',
    price: 49.50,
    quantity: 0,
    rarity: 'Mythic',
    imageUrl: 'https://images.scryfall.com/cards/normal/front/5/b/5bd45296-c23b-427a-a876-022023cb358c.jpg',
    setName: 'Modern Horizons',
    collectorNumber: '217',
    foil: false,
    lang: 'EN'
  },
  {
    id: 'db-8',
    name: 'Mox Opal',
    price: 52.00,
    quantity: 0,
    rarity: 'Mythic',
    imageUrl: 'https://images.scryfall.com/cards/normal/front/5/6/56b3e24e-2d1c-4029-943b-43fb4e5f1aef.jpg',
    setName: 'Scars of Mirrodin',
    collectorNumber: '179',
    foil: false,
    lang: 'EN'
  }
];

export const ARGENTINE_SHIPPING_PROVIDERS = [
  { name: 'Correo Argentino', basePrice: 4200, logo: '✉️' },
  { name: 'Andreani', basePrice: 5800, logo: '🚚' },
  { name: 'OCA', basePrice: 5200, logo: '📦' },
  { name: 'Retiro en punto de encuentro (CABA)', basePrice: 0, logo: '🤝' }
];

export const ARGENTINE_PESO_RATE = 1450; // 1 USD = 1450 ARS (Simulado para Dólar Blue actual)
