import { ItemsTable } from "../components/ItemsTable";

export function Homepage() {
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div style={{ flex: 1, overflowY: "auto", height: "100vh" }}>
          {" "}
          <ItemsTable firestoreCollectionPath="JSONUploads" />
        </div>
        <div style={{ flex: 1, overflowY: "auto", height: "100vh" }}>
          {" "}
          <ItemsTable firestoreCollectionPath="CommonCoreJSONUploads" />
        </div>
      </div>
    </div>
  );
}
