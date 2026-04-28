"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";

interface DishForm {
  name: string;
  description: string;
  price: string;
  type_plat: string;
}

export default function DishFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;

  const [form, setForm] = useState<DishForm>({ name: "", description: "", price: "", type_plat: "standard" });
  const [file, setFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Charger le plat existant si édition
  useEffect(() => {
    if (!editId) return;
    apiFetch(`/dishes/${editId}`)
      .then((r) => r.json())
      .then((dish) => {
        setForm({
          name: dish.name,
          description: dish.description ?? "",
          price: dish.price,
          type_plat: dish.type_plat ?? "standard",
        });
        setExistingImage(dish.image ?? null);
      });
  }, [editId]);

  const handleField = (k: keyof DishForm, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price", form.price);
    formData.append("type_plat", form.type_plat);
    if (file) formData.append("image", file);
    if (isEditing) formData.append("_method", "PUT");

    const url = isEditing ? `/dishes/${editId}` : "/dishes";
    const res = await apiFetch(url, { method: "POST", body: formData });

    setLoading(false);

    if (res.status === 422) {
      const data = await res.json();
      setErrors(data.errors ?? {});
      toast.error("Veuillez corriger les erreurs.");
      return;
    }

    if (res.ok) {
      toast.success(isEditing ? "Plat mis à jour !" : "Plat ajouté !");
      router.push("/admin/dishes");
    } else {
      toast.error("Une erreur est survenue.");
    }
  };

  const handleReset = () => {
    setForm({ name: "", description: "", price: "", type_plat: "standard" });
    setFile(null);
    setExistingImage(null);
    setErrors({});
    if (fileRef.current) fileRef.current.value = "";
  };

  const previewUrl = file
    ? URL.createObjectURL(file)
    : existingImage
    ? `http://resto-api.test/storage/${existingImage}`
    : null;

  const typeOptions = ["standard", "entrée", "plat principal", "dessert", "boisson"];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/admin/dishes")}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {isEditing ? "Modifier le plat" : "Ajouter un plat"}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isEditing ? `Modification de l'ID ${editId}` : "Nouveau plat au catalogue"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="md:col-span-2 space-y-5">
          {/* Nom */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Nom du plat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleField("name", e.target.value)}
              placeholder="Ex: Tiebou yapp"
              className={`w-full px-4 py-3 bg-white border rounded-xl text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all ${
                errors.name ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name[0]}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleField("description", e.target.value)}
              rows={4}
              placeholder="Décrivez le plat…"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all resize-none"
            />
          </div>

          {/* Prix + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Prix (FCFA) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={form.price}
                  onChange={(e) => handleField("price", e.target.value)}
                  placeholder="5000"
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all ${
                    errors.price ? "border-red-400 bg-red-50" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price[0]}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Catégorie
              </label>
              <select
                value={form.type_plat}
                onChange={(e) => handleField("type_plat", e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all appearance-none cursor-pointer"
              >
                {typeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowSaveDialog(true)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1A1D2E] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#252840] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isEditing ? "Mettre à jour" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => setShowResetDialog(true)}
              className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Image uploader */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Photo du plat
            </label>
            {/* Preview */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 mb-3 relative">
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Aperçu" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setExistingImage(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                  <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs">Aucune image</p>
                </div>
              )}
            </div>
            {/* Upload button */}
            <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Choisir une image
              <input
                type="file"
                ref={fileRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
              />
            </label>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">JPEG, PNG — max 2 Mo</p>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={showSaveDialog}
        title={isEditing ? "Confirmer la modification" : "Confirmer l'ajout"}
        message={isEditing
          ? `Êtes-vous sûr de vouloir mettre à jour "${form.name}" ?`
          : `Ajouter "${form.name}" au catalogue ?`}
        confirmLabel={isEditing ? "Mettre à jour" : "Ajouter"}
        cancelLabel="Annuler"
        variant="info"
        onConfirm={() => { setShowSaveDialog(false); handleSubmit(); }}
        onCancel={() => setShowSaveDialog(false)}
      />
      <ConfirmDialog
        open={showResetDialog}
        title="Réinitialiser le formulaire"
        message="Toutes les données saisies seront effacées. Continuer ?"
        confirmLabel="Réinitialiser"
        cancelLabel="Annuler"
        variant="warning"
        onConfirm={() => { setShowResetDialog(false); handleReset(); }}
        onCancel={() => setShowResetDialog(false)}
      />
    </div>
  );
}
