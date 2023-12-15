import { useState } from "react";
import { collection, addDoc, writeBatch, doc } from "firebase/firestore";
import { firestore } from "../utils/firebase";
import { CFAssociation, CFItem } from "../utils/Helpers";

export function JsonUpload() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files ? event.target.files[0] : null);
  };

  const uploadJsonToFirestore = async () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        try {
          const jsonData = JSON.parse(text);

          const batch = writeBatch(firestore);
          const mainDocRef = doc(collection(firestore, "jsonUploads"));

          batch.set(mainDocRef, {
            CFDocument: jsonData.CFDocument,
            CFDefinitions: jsonData.CFDefinitions,
          });

          jsonData.CFItems.forEach((item: CFItem) => {
            // Added type annotation
            const itemDocRef = doc(
              firestore,
              `jsonUploads/${mainDocRef.id}/CFItems`,
              item.identifier
            );
            batch.set(itemDocRef, item);
          });

          jsonData.CFAssociations.forEach((association: CFAssociation) => {
            // Added type annotation
            const associationDocRef = doc(
              firestore,
              `jsonUploads/${mainDocRef.id}/CFAssociations`,
              association.identifier
            );
            batch.set(associationDocRef, association);
          });

          await batch.commit();
          alert("File uploaded successfully to Firestore!");
        } catch (error) {
          console.error("Error uploading file:", error);
          alert("Error in file upload");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div>
      <input type="file" accept=".json" onChange={handleFileChange} />
      <button onClick={uploadJsonToFirestore} disabled={!file}>
        Upload to Firestore
      </button>
    </div>
  );
}
