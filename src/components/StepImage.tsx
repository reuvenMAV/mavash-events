import Image from "next/image";

export function StepImage({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="relative mb-4 overflow-hidden rounded-2xl shadow-sm">
      <Image
        src={src}
        alt={alt}
        width={800}
        height={450}
        priority={priority}
        className="h-36 w-full object-cover object-center sm:h-44"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
}
