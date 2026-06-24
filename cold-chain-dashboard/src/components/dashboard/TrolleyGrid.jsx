import TrolleyCard from './TrolleyCard.jsx';

export default function TrolleyGrid({ trolleys }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {trolleys.map((trolley) => (
        <TrolleyCard key={trolley.id} trolley={trolley} />
      ))}
    </div>
  );
}
