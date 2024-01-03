export interface CFDocument {
  identifier: string;
  uri: string;
  creator: string;
  title: string;
  lastChangeDateTime: string;
  officialSourceURL: string;
  language: string;
  adoptionStatus: string;
  licenseURI: {
    title: string;
    identifier: string;
    uri: string;
  };
}

export interface CFItem {
  identifier: string;
  humanCodingScheme?: string;
  uri: string;
  fullStatement: string;
  CFItemType: string;
  CFItemTypeURI: {
    title: string;
    identifier: string;
    uri: string;
  };
  notes?: string;
  language: string;
  educationLevel: string[];
  lastChangeDateTime: string;
  crosswalkNotes?: string;
}

export interface CFAssociation {
  identifier: string;
  uri: string;
  lastChangeDateTime: string;
  originNodeURI: {
    title: string;
    identifier: string;
    uri: string;
  };
  associationType: string;
  destinationNodeURI: {
    title: string;
    identifier: string;
    uri: string;
  };
}

export interface CFDefinitions {
  CFLicenses: Array<{
    identifier: string;
    uri: string;
    lastChangeDateTime: string;
    title: string;
    description: string;
    licenseText: string;
  }>;
  CFItemTypes: Array<{
    identifier: string;
    uri: string;
    title: string;
    lastChangeDateTime: string;
    description: string;
    typeCode: string;
    hierarchyCode: string;
    standard: boolean;
  }>;
}

export interface JSONDocument {
  id: string;
  CFDocument: CFDocument;
  CFDefinitions: CFDefinitions;
  subject?: string;
}

export type SelectOption = {
  value: string;
  label: string;
};

export interface PendingChange {
  identifier: string;
  field: keyof CFItem;
  value: string;
}

export const educationLevels = [
  "KG",
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

export const subjects = ["Math", "ELA", "Science", "Social Studies"];
