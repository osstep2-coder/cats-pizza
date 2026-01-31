export type Cat = {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
};

export const cats: Cat[] = [
  {
    id: 'cat-1',
    name: 'Маргарита',
    price: 3500,
    description: 'Классический ласковый котик для уютных вечеров.',
    imageUrl: 'https://placekitten.com/320/200',
  },
  {
    id: 'cat-2',
    name: 'Пепперони',
    price: 4200,
    description: 'Очень активный котик, всегда в движении.',
    imageUrl: 'https://placekitten.com/321/200',
  },
  {
    id: 'cat-3',
    name: 'Четыре сыра',
    price: 5100,
    description: 'Мягкий, пушистый и обнимабельный.',
    imageUrl: 'https://placekitten.com/322/200',
  },
];
