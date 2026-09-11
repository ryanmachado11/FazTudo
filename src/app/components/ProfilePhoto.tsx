import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { apiDelete, apiPut } from '../lib/api';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type ProfilePhotoProps = {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  onUploaded?: (avatarUrl: string) => void;
  onRemoved?: () => void;
  allowRemove?: boolean;
};

export function ProfilePhoto({ name, avatarUrl, className, onUploaded, onRemoved, allowRemove = false }: ProfilePhotoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const handleChange = (file: File | undefined) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error('Escolha uma imagem JPG, PNG, WEBP ou GIF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('A imagem deve ter no máximo 2 MB.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = reader.result;
        if (typeof result !== 'string') throw new Error('Imagem inválida.');
        const response = await apiPut<{ avatarUrl: string }>('/api/auth/me/avatar', { avatarUrl: result });
        onUploaded?.(response.avatarUrl);
        toast.success('Foto de perfil atualizada.');
      } catch (error: any) {
        toast.error(error?.message || 'Não foi possível enviar a foto.');
      } finally {
        setIsUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast.error('Não foi possível ler a imagem.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = async () => {
    if (!avatarUrl || !window.confirm('Deseja remover sua foto de perfil?')) return;

    setIsUploading(true);
    try {
      await apiDelete('/api/auth/me/avatar');
      onRemoved?.();
      toast.success('Foto de perfil removida.');
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível remover a foto.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="cursor-pointer disabled:cursor-wait">
        <Avatar className={className}>
          {avatarUrl && <AvatarImage src={avatarUrl} alt={`Foto de ${name}`} />}
          <AvatarFallback className="bg-secondary/20 text-secondary text-xl font-bold">{initials}</AvatarFallback>
        </Avatar>
      </button>
      {allowRemove && avatarUrl && (
        <button type="button" onClick={handleRemove} disabled={isUploading} className="text-xs text-destructive hover:underline disabled:cursor-wait">
          Remover foto
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => handleChange(event.target.files?.[0])} />
    </>
  );
}