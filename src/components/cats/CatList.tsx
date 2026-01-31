import type { Cat } from '../../data/cats';
import { CatCard } from './CatCard';
import './Cats.css';

interface CatListProps {
  cats: Cat[];
  onAddToCart: (cat: Cat) => void;
}

export function CatList({ cats, onAddToCart }: CatListProps) {
  return (
    <div className="cat-list">
      {cats.map((cat) => (
        <CatCard key={cat.id} cat={cat} onAddToCart={() => onAddToCart(cat)} />
      ))}
    </div>
  );
}
