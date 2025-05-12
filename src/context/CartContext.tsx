import React, { createContext, useContext, useState, ReactNode } from 'react';

const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<any[]>([]);

  const addToCart = (item: any) => {
    setCartItems(prev => {
      const index = prev.findIndex(i => i.id === item.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index].quantity += 1;
        return updated;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };
  
  const decreaseQuantity = (itemId: string) => {
    setCartItems(prev => {
      return prev
        .map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0); // auto-remove if 0
    });
  };
  

  const clearCart = () => {
    setCartItems([]);
  };

  const removeFromCart = (indexToRemove: number) => {
    setCartItems(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  

  return (
    <CartContext.Provider value={{ cartItems, addToCart, clearCart, removeFromCart, decreaseQuantity }}>


      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
