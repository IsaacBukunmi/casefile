import { useParams } from 'react-router'

// Placeholder until Step 9 builds the document review screen.
export function DocumentPage() {
  const { documentId } = useParams()

  return <h1 className="font-display text-h1 text-fg-strong">Document {documentId}</h1>
}
