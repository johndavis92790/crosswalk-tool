import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";
import Select from "react-select";
import "./CFItemsTable.css";
import {
  CFDefinitions,
  CFDocument,
  CFItem,
  JSONDocument,
  SelectOption,
  educationLevels,
} from "../utils/Helpers";
import { CCJsonUpload } from "./CCJsonUpload";

export function CCItemsTable() {
  const firestore = getFirestore();
  const [docs, setDocs] = useState<JSONDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [selectedCFItems, setSelectedCFItems] = useState<CFItem[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);
  const [editState, setEditState] = useState<{ [key: string]: boolean }>({});

  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  const [cfItemTypeOptions, setCfItemTypeOptions] = useState<SelectOption[]>(
    [],
  );
  const [selectedCFItemTypes, setSelectedCFItemTypes] = useState<string[]>([]);

  // Function to handle fetching documents
  useEffect(() => {
    const fetchDocs = async () => {
      const querySnapshot = await getDocs(
        collection(firestore, "CommonCoreJSONUploads"),
      );
      const documents = querySnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        CFDocument: docSnapshot.data().CFDocument as CFDocument,
        CFDefinitions: docSnapshot.data().CFDefinitions as CFDefinitions,
      }));
      setDocs(documents);
    };

    fetchDocs();
  }, [firestore]);

  useEffect(() => {
    const fetchCFItems = async () => {
      if (selectedDocId) {
        const itemsSnapshot = await getDocs(
          collection(
            firestore,
            `CommonCoreJSONUploads/${selectedDocId}/CFItems`,
          ),
        );
        const items = itemsSnapshot.docs.map((doc) => doc.data() as CFItem);

        // Get the standardTypes from the selected document
        const selectedDoc = docs.find((doc) => doc.id === selectedDocId);
        const standardTypes = selectedDoc?.CFDefinitions.CFItemTypes.filter(
          (type) => type.standard,
        ).map((type) => type.title);

        // Filter items based on standardTypes
        const filteredItems = items.filter(
          (item) => standardTypes?.includes(item.CFItemType),
        );
        setSelectedCFItems(filteredItems);
      }
    };

    fetchCFItems();
  }, [selectedDocId, firestore, docs]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingChanges.length > 0) {
        saveChanges();
      }
    }, 3000); // Save every 3 seconds

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [selectedCFItems, pendingChanges, selectedDocId, firestore]);

  // Filter the table based on selected education levels
  useEffect(() => {
    if (selectedDocId) {
      const selectedDoc = docs.find((doc) => doc.id === selectedDocId);
      if (selectedDoc && selectedCFItems) {
        const filteredItems =
          selectedLevels.length > 0
            ? selectedCFItems.filter((item: any) =>
                selectedLevels.some((level) =>
                  item.educationLevel.includes(level),
                ),
              )
            : selectedCFItems;
        setSelectedCFItems(filteredItems);
      }
    }
  }, [selectedDocId, selectedLevels, selectedCFItemTypes, docs]);

  useEffect(() => {
    // Assuming selectedCFItems is already populated with the CFItems
    const uniqueCFItemTypes = Array.from(
      new Set(selectedCFItems.map((item) => item.CFItemType)),
    );

    const options = uniqueCFItemTypes.map((type) => ({
      value: type,
      label: type,
    }));

    setCfItemTypeOptions(options);
  }, [selectedCFItems]);

  // Function to handle document selection
  const handleDocSelect = (e: React.ChangeEvent<any>) => {
    const target = e.target as HTMLSelectElement;
    const docId = target.value;
    setSelectedDocId(docId);
    const selectedDoc = docs.find((doc) => doc.id === docId);
    if (selectedDoc && selectedCFItems) {
      setSelectedCFItems(selectedCFItems);
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
      }),
    );
  };

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (pendingChanges.length > 0) {
      e.preventDefault();
      e.returnValue =
        "You have unsaved changes. Are you sure you want to leave?";
    }
  };

  const handleEdit = (
    identifier: string,
    field: keyof CFItem,
    value: string,
  ) => {
    const updatedItems = selectedCFItems.map((item) =>
      item.identifier === identifier ? { ...item, [field]: value } : item,
    );
    setSelectedCFItems(updatedItems);
    setPendingChanges([...pendingChanges, { identifier, field, value }]);
  };

  const saveChanges = async () => {
    setIsSaving(true);
    console.log("Saving changes to Firestore...");
    try {
      const docRef = doc(firestore, "CommonCoreJSONUploads", selectedDocId);
      await updateDoc(docRef, { CFItems: selectedCFItems });
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
        rows={1} // Starts with one line
        style={{ resize: "none", overflowY: "hidden" }} // Prevents manual resizing
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement; // Cast to HTMLTextAreaElement
          target.style.height = "auto";
          target.style.height = target.scrollHeight + "px";
        }}
      />
    );
  };

  const levelOptions = educationLevels.map((level) => ({
    value: level,
    label: level,
  }));

  const handleLevelChange = (selectedOptions: any) => {
    const levels = selectedOptions
      ? selectedOptions.map((option: any) => option.value)
      : [];
    setSelectedLevels(levels);
  };

  const handleCFItemTypeChange = (selectedOptions: any) => {
    setSelectedCFItemTypes(selectedOptions.map((option: any) => option.value));
  };

  function displayStandardTypes() {
    const selectedDoc = docs.find((doc) => doc.id === selectedDocId);
    const standardTypes = selectedDoc?.CFDefinitions.CFItemTypes.filter(
      (type) => type.standard,
    ).map((type) => type.description);
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
      <CCJsonUpload />
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

      <Form.Group controlId="cfItemTypeSelect">
        <Form.Label>Filter by CFItemType</Form.Label>
        <Select
          isMulti
          options={cfItemTypeOptions}
          value={cfItemTypeOptions.filter((option) =>
            selectedCFItemTypes.includes(option.value),
          )}
          onChange={handleCFItemTypeChange}
          className="basic-multi-select"
          classNamePrefix="select"
        />
      </Form.Group>

      <Form.Group controlId="filterLevelSelect">
        <Form.Label>Filter by Education Level</Form.Label>
        <Select
          isMulti
          options={levelOptions}
          value={levelOptions.filter((option) =>
            selectedLevels.includes(option.value),
          )}
          onChange={handleLevelChange}
          className="basic-multi-select"
          classNamePrefix="select"
        />
      </Form.Group>

      {isSaving ? <div>Saving changes...</div> : <div>Changes saved.</div>}

      {displayStandardTypes()}

      <Table size="sm" className="standards-table" striped bordered hover>
        <thead>
          <tr>
            <th onClick={() => handleSort("humanCodingScheme")}>
              Code {renderSortIndicator("humanCodingScheme")}
            </th>
            <th>CFItemType</th>
            <th>Full Statement</th>
            <th>Education Level</th>
            <th className="hidden-column">Identifier</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {selectedCFItems.map((item, index) => (
            <tr key={index}>
              <td>{item.humanCodingScheme ? item.humanCodingScheme : "N/A"}</td>
              <td>{item.CFItemType ? item.CFItemType : "N/A"}</td>
              <td>{renderEditableCell(item, "fullStatement")}</td>
              <td>
                {item.educationLevel ? item.educationLevel.join(", ") : "N/A"}
              </td>
              <td className="hidden-column">{item.identifier}</td>
              <td>{renderEditableCellForNotes(item)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
