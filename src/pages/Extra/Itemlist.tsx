import React from 'react';

interface Item {
  id: string;
  name: string;
  quantity: number;
  // Add other item properties as needed
}

interface ItemListProps {
  items?: Item[];
  onItemClick?: (item: Item) => void;
}

const ItemList: React.FC<ItemListProps> = ({ items = [], onItemClick }) => {
  return (
    <div className="item-list">
      <h3>Inventory Items</h3>
      {items.length === 0 ? (
        <p>No items found</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li 
              key={item.id} 
              onClick={() => onItemClick?.(item)}
              style={{ cursor: onItemClick ? 'pointer' : 'default' }}
            >
              {item.name} - {item.quantity} units
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ItemList;