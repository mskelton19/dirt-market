interface Listing {
  title: string;
  materialType: string;
  quantity: number;
  unit: string;
  address?: string;
  contact_company?: string;
  contact_first_name?: string;
  listing_type: string;
}

interface User {
  user_metadata?: {
    first_name?: string;
  };
}

export function generateListingEmailBody(listing: Listing, user: User | null): string {
  const materialTypeFormatted = listing.materialType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const emailBody = `Hi ${listing.contact_first_name || 'there'},

I saw you've got ${listing.quantity} ${listing.unit} of ${materialTypeFormatted} listed for ${listing.listing_type.toLowerCase()}. I'm looking to move this type of material and think we might be a good fit to work together.

Let me know if there's a good time to connect — happy to keep it quick.

Thanks,
${user?.user_metadata?.first_name || 'A potential customer'}`;

  return encodeURIComponent(emailBody.trim());
} 