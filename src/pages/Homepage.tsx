import { CCItemsTable } from "../components/CCItemsTable";
import { CFItemsTable } from "../components/CFItemsTable";

export function Homepage() {
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div style={{ flex: 1, overflowY: "auto", height: "100vh" }}>
          {" "}
          <CFItemsTable />
        </div>
        <div style={{ flex: 1, overflowY: "auto", height: "100vh" }}>
          {" "}
          <CCItemsTable />
        </div>
      </div>
    </div>
  );
}
