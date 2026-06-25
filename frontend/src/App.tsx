import { Header } from "./components/Header";
import { Board } from "./components/Board";

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Board />
    </div>
  );
}

export default App;
