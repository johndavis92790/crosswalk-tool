import { useState } from "react";
import { collection, writeBatch, doc, setDoc } from "firebase/firestore";
import { firestore } from "../utils/firebase";
import Spinner from "react-bootstrap/Spinner";

export function CFJsonUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState<any>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [availableTypesDetails, setAvailableTypesDetails] = useState<
    Array<{
      title: string;
      standard: boolean;
    }>
  >([]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files ? event.target.files[0] : null;
    setFile(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        const types = data.CFDefinitions.CFItemTypes.map(
          (CFItemType: {
            identifier: string;
            uri: string;
            title: string;
            lastChangeDateTime: string;
            description: string;
            typeCode: string;
            hierarchyCode: string;
          }) => ({
            title: CFItemType.title,
            standard: false,
          }),
        );

        setAvailableTypesDetails(types);
        setJsonData(data);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleStandardTypeChange = (title: string) => {
    setAvailableTypesDetails((prevTypes) =>
      prevTypes.map((type) =>
        type.title === title ? { ...type, standard: !type.standard } : type,
      ),
    );
  };

  const uploadJsonToFirestore = async () => {
    if (jsonData) {
      setIsUploading(true);

      try {
        // Update CFItemTypes in jsonData with standard field
        jsonData.CFDefinitions.CFItemTypes.forEach((type: any) => {
          const foundType = availableTypesDetails.find(
            (availableType) => availableType.title === type.title,
          );
          type.standard = foundType ? foundType.standard : false;
        });

        // Create a new document with an auto-generated ID
        const mainDocRef = doc(collection(firestore, "JSONUploads"));
        await setDoc(mainDocRef, {
          CFDocument: jsonData.CFDocument,
          CFDefinitions: jsonData.CFDefinitions,
        });

        // Then process CFItems and CFAssociations in smaller batches
        const batchSize = 500;
        const items = jsonData.CFItems;
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = writeBatch(firestore);
          const end = Math.min(i + batchSize, items.length);
          for (let j = i; j < end; j++) {
            const item = items[j];
            const itemDocRef = doc(
              firestore,
              `JSONUploads/${mainDocRef.id}/CFItems`,
              item.identifier,
            );
            batch.set(itemDocRef, item);
          }
          await batch.commit();
        }

        const associations = jsonData.CFAssociations;
        for (let i = 0; i < associations.length; i += batchSize) {
          const batch = writeBatch(firestore);
          const end = Math.min(i + batchSize, associations.length);
          for (let j = i; j < end; j++) {
            const association = associations[j];
            const associationDocRef = doc(
              firestore,
              `JSONUploads/${mainDocRef.id}/CFAssociations`,
              association.identifier,
            );
            batch.set(associationDocRef, association);
          }
          await batch.commit();
        }

        alert("File uploaded successfully to Firestore!");
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("Error in file upload");
      } finally {
        setIsUploading(false);
      }
    } else {
      alert("Please select and process a file first.");
    }
  };

  return (
    <div>
      <input type="file" accept=".json" onChange={handleFileChange} />
      <div>
        {availableTypesDetails.map((type, index) => (
          <div key={index}>
            <input
              type="checkbox"
              id={type.title}
              name={type.title}
              checked={type.standard}
              onChange={() => handleStandardTypeChange(type.title)}
            />
            <label htmlFor={type.title}>{type.title}</label>
          </div>
        ))}
      </div>
      <button
        onClick={uploadJsonToFirestore}
        disabled={!jsonData || isUploading}
      >
        {isUploading ? <Spinner animation="border" /> : "Upload to Firestore"}
      </button>
    </div>
  );
}
