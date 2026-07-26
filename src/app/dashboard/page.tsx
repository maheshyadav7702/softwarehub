import Categories from "../components/Categories";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  return (
    <>
      <Navbar />

      <main style={{ padding: "20px" }}>
        <Categories />
      </main>
    </>
  );
}