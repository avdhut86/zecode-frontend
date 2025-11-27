import Link from 'next/link';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav className="flex items-center text-sm text-gray-600 mb-6">
            {items.map((item, index) => (
                <span key={index} className="flex items-center">
                    {item.href ? (
                        <Link 
                            href={item.href} 
                            className="hover:text-gray-900 transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-gray-900">{item.label}</span>
                    )}
                    {index < items.length - 1 && (
                        <span className="mx-2 text-gray-400">/</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
