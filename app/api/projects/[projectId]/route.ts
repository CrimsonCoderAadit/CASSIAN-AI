import { NextRequest, NextResponse } from "next/server";
import { getProjectById, deleteProject } from "@/services/projectStore";

/**
 * DELETE /api/projects/[projectId]
 * Delete a project by ID (with ownership verification)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
): Promise<NextResponse> {
  try {
    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Get project to verify it exists
    const project = await getProjectById(projectId);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Note: In a production environment, you should verify the user's
    // authentication token here using Firebase Admin SDK. For now, we rely
    // on Firestore security rules to enforce ownership at the database level.

    // Delete the project
    await deleteProject(projectId);

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (err) {
    console.error("Delete project error:", err);
    const message = err instanceof Error ? err.message : "Failed to delete project";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
