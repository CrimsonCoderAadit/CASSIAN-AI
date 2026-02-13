import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Project, ProjectSource, ParsedFile, FileChunk } from "@/types";

const PROJECTS_COLLECTION = "projects";

/**
 * Create a new code project
 */
export async function createProject(params: {
  userId: string;
  name: string;
  source: ProjectSource;
  githubUrl?: string;
  rawCode?: string;
  parsedFiles?: ParsedFile[];
  chunks?: FileChunk[];
  summary?: string;
  architecture?: string;
}): Promise<string> {
  const projectData = {
    userId: params.userId,
    name: params.name,
    source: params.source,
    githubUrl: params.githubUrl || null,
    rawCode: params.rawCode || null,
    createdAt: Timestamp.now(),
    parsedFiles: params.parsedFiles || [],
    chunks: params.chunks || [],
    summary: params.summary || null,
    architecture: params.architecture || null,
  };

  const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), projectData);
  return docRef.id;
}

/**
 * Get all projects for a specific user
 */
export async function getProjects(userId: string): Promise<Project[]> {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);
  const projects: Project[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    projects.push({
      id: doc.id,
      userId: data.userId,
      name: data.name,
      source: data.source as ProjectSource,
      githubUrl: data.githubUrl || undefined,
      rawCode: data.rawCode || undefined,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      parsedFiles: data.parsedFiles || [],
      chunks: data.chunks || [],
      summary: data.summary || undefined,
      architecture: data.architecture || undefined,
    });
  });

  return projects;
}

/**
 * Get a single project by ID
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId,
    name: data.name,
    source: data.source as ProjectSource,
    githubUrl: data.githubUrl || undefined,
    rawCode: data.rawCode || undefined,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    parsedFiles: data.parsedFiles || [],
    chunks: data.chunks || [],
    summary: data.summary || undefined,
    architecture: data.architecture || undefined,
  };
}

/**
 * Delete a project by ID
 */
export async function deleteProject(projectId: string): Promise<void> {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
  await deleteDoc(docRef);
}
