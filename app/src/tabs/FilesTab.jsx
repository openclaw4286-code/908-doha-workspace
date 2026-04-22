import EmptyScaffold from '../components/EmptyScaffold.jsx';

export default function FilesTab() {
  return (
    <EmptyScaffold
      title="Files"
      subtitle="드래그앤드롭 업로드. v1은 Base64 5MB 제한, 이후 Drive/S3 연동 검토."
      spec="F-FILE"
    />
  );
}
