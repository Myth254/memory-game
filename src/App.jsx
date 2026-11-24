import { useEffect, useState } from "react";
import './App.css'

const CARD_COUNT = 12;
const LIST_URL = `https://pokeapi.co/api/v2/pokemon?limit=${CARD_COUNT}&offset=0`;
const artworkUrl = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

// Fisher-Yates shuffle. Returns a NEW array so React sees the state change.
function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function App() {
  const [cards, setCards] = useState([]);        // [{ id, name, image }]
  const [clickedIds, setClickedIds] = useState([]); // ids picked this round
  const [bestScore, setBestScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const score = clickedIds.length;

  // 1. Load the Pokemon once, when the component mounts.
  useEffect(() => {
    let ignore = false; // avoids setting state after unmount / StrictMode double-run

    async function loadPokemon() {
      try {
        const res = await fetch(LIST_URL);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();

        const loaded = data.results.map(({ name, url }) => {
          const id = url.split("/").filter(Boolean).pop(); // "…/pokemon/25/" -> "25"
          return { id, name, image: artworkUrl(id) };
        });

        if (!ignore) setCards(shuffle(loaded));
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadPokemon();
    return () => {
      ignore = true;
    };
  }, []);

  // 2. The "trigger": runs whenever a card is clicked.
  function handleCardClick(id) {
    if (clickedIds.includes(id)) {
      // Already picked this round -> game over, reset the round.
      setClickedIds([]);
    } else {
      const next = [...clickedIds, id];
      setClickedIds(next);
      setBestScore((best) => Math.max(best, next.length));

      if (next.length === CARD_COUNT) {
        // Picked every card once -> win, start a fresh round.
        setClickedIds([]);
      }
    }

    // 3. Shuffle after EVERY pick, right or wrong.
    setCards((current) => shuffle(current));
  }

  if (loading) return <p>Loading Pokémon…</p>;
  if (error) return <p>Something went wrong: {error}</p>;

  return (
    <main>
      <header>
        <h1>Pokémon Memory Game</h1>
        <p>Score: {score} | Best: {bestScore}</p>
      </header>

      <section className="grid">
        {cards.map((card) => (
          <button
            key={card.id}
            className="card"
            onClick={() => handleCardClick(card.id)}
          >
            <img src={card.image} alt={card.name} width="120" height="120" />
            <span>{card.name}</span>
          </button>
        ))}
      </section>
    </main>
  );
}