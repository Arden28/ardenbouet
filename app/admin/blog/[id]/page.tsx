// /admin/blog/[id] — the full-screen story editor
import StoryEditor from '../editor/StoryEditor';

export const metadata = { title: 'Edit story · Admin' };

export default function EditStoryPage({ params }: { params: { id: string } }) {
  return <StoryEditor id={params.id} />;
}
