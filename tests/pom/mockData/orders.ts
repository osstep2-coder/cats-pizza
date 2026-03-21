export const oneOrder = {
  orders: [
    {
      id: 'order-1',
      ownerType: 'user',
      ownerId: 'user-1',
      userId: 'user-1',
      guestSessionId: null,
      items: [
        {
          id: 'cat-2',
          name: 'Пепперони',
          basePrice: 4200,
          price: 4200,
          options: {
            furType: 'Средняя',
            activityLevel: 'Игровой',
            extras: [],
          },
          quantity: 1,
        },
      ],
      totalPrice: 4200,
      customer: {
        city: '1',
        street: '1',
        house: '1',
        apartment: '',
        comment: '',
        payment: 'card',
      },
      createdAt: '2026-03-21T13:01:43.217Z',
    },
  ],
};

export const emptyOrders = {
  orders: [],
};
