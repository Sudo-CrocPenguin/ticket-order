import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

const documentTypes = [
  "image/*",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const readWebFileAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const pickEvidence = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: documentTypes,
    multiple: false,
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets?.[0];

  if (!asset) {
    return null;
  }

  const contentBase64 =
    Platform.OS === "web" && asset.file
      ? await readWebFileAsBase64(asset.file)
      : await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

  return {
    fileName: asset.name || "evidencia",
    mimeType: asset.mimeType || "application/octet-stream",
    size: asset.size || 0,
    contentBase64,
  };
};
