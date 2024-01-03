import { ChangeEvent, useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";
import Select, { MultiValue } from "react-select";
import "./ItemsTable.css";
import {
  CFAssociation,
  CFDefinitions,
  CFDocument,
  CFItem,
  JSONDocument,
  PendingChange,
  SelectOption,
  educationLevels,
} from "../utils/Helpers";
import { JsonUpload } from "./JsonUpload";

interface ItemsTableProps {
  firestoreCollectionPath: string;
}

export function ItemsTable(props: ItemsTableProps) {
  const { firestoreCollectionPath } = props;

  const firestore = getFirestore();
  const [docs, setDocs] = useState<JSONDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [selectedCFItems, setSelectedCFItems] = useState<CFItem[]>([]);
  const [cfAssociations, setCFAssociations] = useState<CFAssociation[]>([]);
  const [cfItemMapping, setCFItemMapping] = useState<{ [key: string]: CFItem }>(
    {}
  );
  const [originalSelectedCFItems, setOriginalSelectedCFItems] = useState<
    CFItem[]
  >([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);
  const [editState, setEditState] = useState<{ [key: string]: boolean }>({});
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const basePath = "/CommonCoreJSONUploads/CCMath/CFItems";

  // Adjusted fetchDocs for dynamic collection path
  useEffect(() => {
    const fetchDocs = async () => {
      const querySnapshot = await getDocs(
        collection(firestore, firestoreCollectionPath)
      );
      const documents = querySnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        CFDocument: docSnapshot.data().CFDocument as CFDocument,
        CFDefinitions: docSnapshot.data().CFDefinitions as CFDefinitions,
      }));
      setDocs(documents);
    };

    fetchDocs();
  }, [firestore, firestoreCollectionPath]);

  useEffect(() => {
    const fetchCFItems = async () => {
      if (selectedDocId) {
        const itemsSnapshot = await getDocs(
          collection(
            firestore,
            `${firestoreCollectionPath}/${selectedDocId}/CFItems`
          )
        );
        const items = itemsSnapshot.docs.map((doc) => doc.data() as CFItem);

        // Get the standardTypes from the selected document
        const selectedDoc = docs.find((doc) => doc.id === selectedDocId);
        const standardTypes = selectedDoc?.CFDefinitions.CFItemTypes.filter(
          (type) => type.standard
        ).map((type) => type.title);

        // Filter items based on standardTypes
        const filteredItems = items.filter(
          (item) => standardTypes?.includes(item.CFItemType)
        );
        setSelectedCFItems(filteredItems);
        setOriginalSelectedCFItems(filteredItems);
      }
    };

    fetchCFItems();
  }, [selectedDocId, firestore, docs, firestoreCollectionPath]);

  useEffect(() => {
    const fetchCFAssociations = async () => {
      if (selectedDocId && firestoreCollectionPath != "CommonCoreJSONUploads") {
        const associationsSnapshot = await getDocs(
          collection(
            firestore,
            `${firestoreCollectionPath}/${selectedDocId}/CFAssociations`
          )
        );
        const associations = associationsSnapshot.docs.map(
          (doc) => doc.data() as CFAssociation
        );
        setCFAssociations(associations);
        const cfItems = await fetchCFItemsForAssociations(associations);
        setCFItemMapping(cfItems);
      }
    };
    fetchCFAssociations();
  }, [selectedDocId, firestore, docs, firestoreCollectionPath]);

  useEffect(() => {
    // This will prompt the user if they try to leave with unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingChanges.length > 0) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pendingChanges]);

  // Filter the table based on selected education levels
  useEffect(() => {
    if (selectedDocId) {
      const selectedDoc = docs.find((doc) => doc.id === selectedDocId);
      if (selectedDoc && selectedCFItems) {
        console.log(selectedLevels);
        const filteredItems =
          selectedLevels.length > 0
            ? originalSelectedCFItems.filter((item: CFItem) =>
                selectedLevels.some(
                  (level) => item.educationLevel?.includes(level)
                )
              )
            : originalSelectedCFItems;
        console.log(filteredItems);
        setSelectedCFItems(filteredItems);
      }
    }
  }, [
    selectedDocId,
    selectedLevels,
    docs,
    originalSelectedCFItems,
    selectedCFItems,
  ]);

  // Function to map CFItem to its corresponding CFAssociations
  const getDestinationNodeIdentifiers = (cfItemId: string): string[] => {
    return cfAssociations
      .filter(
        (assoc) =>
          assoc.originNodeURI.identifier === cfItemId &&
          assoc.associationType === "isRelatedTo"
      )
      .map((assoc) => assoc.destinationNodeURI.identifier);
  };

  const fetchCFItemsForAssociations = async (associations: CFAssociation[]) => {
    const uniqueIdentifiers = Array.from(
      new Set(associations.map((assoc) => assoc.destinationNodeURI.identifier))
    );
    const cfItems: { [key: string]: CFItem } = {};

    for (const id of uniqueIdentifiers) {
      const docRef = doc(firestore, `${basePath}/${id}`);
      const docSnap = await getDoc(docRef);
      console.log(docSnap)
      if (docSnap.exists()) {
        cfItems[id] = docSnap.data() as CFItem;
      }
    }

    return cfItems; // This is an object mapping identifiers to CFItems
  };

  const getHumanCodingSchemes = (cfItemId: string): string[] => {
    return cfAssociations
      .filter((assoc) => assoc.originNodeURI.identifier === cfItemId)
      .map(
        (assoc) =>
          cfItemMapping[assoc.destinationNodeURI.identifier]
            ?.humanCodingScheme || "N/A"
      );
  };

  // Function to handle document selection
  const handleDocSelect = (e: ChangeEvent<any>) => {
    if (e.target instanceof HTMLSelectElement) {
      const docId = e.target.value;
      setSelectedDocId(docId);
      const selectedDoc = docs.find((doc) => doc.id === docId);
      if (selectedDoc && selectedCFItems) {
        setSelectedCFItems(selectedCFItems);
      }
    }
  };

  // Updated sorting function
  const handleSort = (columnName: keyof CFItem) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === columnName &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key: columnName, direction });

    setSelectedCFItems(
      [...selectedCFItems].sort((a, b) => {
        if (a[columnName] && b[columnName]) {
          return direction === "ascending"
            ? String(a[columnName]).localeCompare(String(b[columnName]))
            : String(b[columnName]).localeCompare(String(a[columnName]));
        }
        return 0;
      })
    );
  };

  const handleEdit = (
    identifier: string,
    field: keyof CFItem,
    value: string
  ) => {
    const updatedItems = selectedCFItems.map((item) =>
      item.identifier === identifier ? { ...item, [field]: value } : item
    );
    setSelectedCFItems(updatedItems);

    // Update pending changes
    const changeIndex = pendingChanges.findIndex(
      (change) => change.identifier === identifier && change.field === field
    );
    if (changeIndex >= 0) {
      pendingChanges[changeIndex].value = value;
    } else {
      setPendingChanges([...pendingChanges, { identifier, field, value }]);
    }
  };

  const saveChanges = async () => {
    setIsSaving(true);
    console.log("Saving changes to Firestore...");

    try {
      for (const change of pendingChanges) {
        const docRef = doc(
          firestore,
          `${firestoreCollectionPath}/${selectedDocId}/CFItems`,
          change.identifier
        );
        await updateDoc(docRef, { [change.field]: change.value });
      }
      console.log("Changes saved successfully.");
      setPendingChanges([]);
    } catch (error) {
      console.error("Error saving changes:", error);
    }

    setIsSaving(false);
  };

  // Function to render editable cell
  const renderEditableCell = (item: CFItem, field: keyof CFItem) => {
    const value = item[field];
    const displayValue =
      typeof value === "object" ? JSON.stringify(value) : value || "";

    return editState[item.identifier + field] ? (
      <input
        type="text"
        value={displayValue}
        onBlur={() =>
          setEditState({ ...editState, [item.identifier + field]: false })
        }
        onChange={(e) => handleEdit(item.identifier, field, e.target.value)}
      />
    ) : (
      <span
        onClick={() =>
          setEditState({ ...editState, [item.identifier + field]: true })
        }
      >
        {displayValue}
      </span>
    );
  };

  // Function to render table headers with sorting indicators
  const renderSortIndicator = (columnName: string) => {
    if (sortConfig?.key === columnName) {
      return sortConfig.direction === "ascending" ? (
        <span className="material-icons">expand_less</span>
      ) : (
        <span className="material-icons">expand_more</span>
      );
    }
    return <span className="material-icons">unfold_more</span>;
  };

  // Function to render editable cell for notes
  const renderEditableCellForNotes = (item: CFItem) => {
    return (
      <textarea
        className="editable-cell"
        value={item.crosswalkNotes || ""}
        onChange={(e) =>
          handleEdit(item.identifier, "crosswalkNotes", e.target.value)
        }
        rows={1}
        style={{ resize: "none", overflowY: "hidden" }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = "auto";
          target.style.height = target.scrollHeight + "px";
        }}
      />
    );
  };

  const levelOptions = educationLevels.map(
    (level): SelectOption => ({
      value: level,
      label: level,
    })
  );

  const handleLevelChange = (newValue: MultiValue<SelectOption>) => {
    const levels = newValue ? newValue.map((option) => option.value) : [];
    setSelectedLevels(levels);
  };

  function displayStandardTypes() {
    const selectedDoc = docs.find((doc) => doc.id === selectedDocId);
    const standardTypes = selectedDoc?.CFDefinitions.CFItemTypes.filter(
      (type) => type.standard
    ).map((type) => type.title);
    return (
      <div>
        <strong>Standard Types:</strong>
        <ul>
          {standardTypes?.map((type, index) => <li key={index}>{type}</li>)}
        </ul>
      </div>
    );
  }

  return (
    <div>
      {firestoreCollectionPath === "CommonCoreJSONUploads" ? (
        <JsonUpload
          firestoreCollectionPath={firestoreCollectionPath}
          includeDocIdInput={true}
        />
      ) : (
        <JsonUpload firestoreCollectionPath={firestoreCollectionPath} />
      )}
      <Form.Group controlId="docSelect">
        <Form.Label>Select Document</Form.Label>
        <Form.Control
          as="select"
          value={selectedDocId}
          onChange={handleDocSelect}
        >
          <option value="">Select a Document</option>
          {docs.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.CFDocument.title}
            </option>
          ))}
        </Form.Control>
      </Form.Group>

      <Form.Group controlId="filterLevelSelect">
        <Form.Label>Filter by Education Level</Form.Label>
        <Select
          isMulti
          options={levelOptions}
          value={levelOptions.filter((option) =>
            selectedLevels.includes(option.value)
          )}
          onChange={handleLevelChange}
          className="basic-multi-select"
          classNamePrefix="select"
        />
      </Form.Group>

      {displayStandardTypes()}

      <button onClick={saveChanges} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Changes"}
      </button>

      <Table size="sm" className="standards-table" striped bordered hover>
        <thead>
          <tr>
            <th onClick={() => handleSort("humanCodingScheme")}>
              Code {renderSortIndicator("humanCodingScheme")}
            </th>
            <th>Full Statement</th>
            <th>Education Level</th>
            <th className="hidden-column">Identifier</th>
            <th>Notes</th>
            {firestoreCollectionPath != "CommonCoreJSONUploads" ? (
              <th>Associated Human Coding Schemes</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {selectedCFItems.map((item, index) => (
            <tr key={index}>
              <td>{item.humanCodingScheme ? item.humanCodingScheme : "N/A"}</td>
              <td>{renderEditableCell(item, "fullStatement")}</td>
              <td>
                {item.educationLevel ? item.educationLevel.join(", ") : "N/A"}
              </td>
              <td className="hidden-column">{item.identifier}</td>
              <td>{renderEditableCellForNotes(item)}</td>
              {firestoreCollectionPath != "CommonCoreJSONUploads" ? (
                <td>{getHumanCodingSchemes(item.identifier).join(", ")}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
