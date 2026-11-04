export default function AdminLoading() {
  return (
    <div className="min-h-[calc(100vh-90px)] bg-[#f6f8fb] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-[#001f3f] border-t-transparent animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Cargando administración…</p>
      </div>
    </div>
  );
}
