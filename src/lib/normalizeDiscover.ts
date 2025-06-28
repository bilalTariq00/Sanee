import { User } from "@/types/User";
import config from "@/config";

// Format image URLs
const toImg = (path: string | null): string => {
  if (!path) return "https://ui-avatars.com/api/?name=User";

  if (path.startsWith("http")) return path;

  // Always serve from /storage/ for consistency
  const normalizedPath = path.replace(/^\/?storage\/?/, "").replace(/^\/?/, "");
  return `${config.IMG_BASE_URL}/storage/${normalizedPath}`;
};


export function normalizeDiscover(
  res: any,
  type: string
): { users: User[]; totalPages: number } {
  const totalPages =
    res?.data?.gigs?.last_page ||
    res?.data?.jobs?.last_page ||
    res?.last_page ||
    res?.data?.last_page ||
    1;

  const baseUsers =
    Array.isArray(res?.data?.data) ? res.data.data :
    Array.isArray(res?.data) ? res.data :
    Array.isArray(res) ? res :
    [];

  const isGigLike = (item: any) => item?.user && item?.price;
  const isJobLike = (item: any) => item?.buyer && item?.budget;
  const isPerson = (item: any) => item?.uid && !item?.buyer && !item?.user;

  // Case 1: People (sellerpeople, buyerpeople, or fallback)
  if (["sellerpeople", "buyerpeople"].includes(type) || (baseUsers.length && isPerson(baseUsers[0]))) {
    const users: User[] = baseUsers.map((person: any) => ({
      id: person.id.toString(),
      uid: person.uid,
      name: `${person.first_name} ${person.last_name}`.trim(),
      avatar: toImg(person.image),
      location: person.country_id ? `Country ID ${person.country_id}` : "—",
      badge: type.includes("seller") ? "Seller" : "Buyer",
      rating: 0,
      hourlyRate: 0,
      experience: person.summary?.slice(0, 40) + "…" || "—",
      followers: 0,
      skills: [],
      projects: [],
      bio: person.summary || "",
    }));
    return { users, totalPages };
  }

  // Case 2: Gigs
  const gigs = res?.data?.gigs?.data || (baseUsers.length && isGigLike(baseUsers[0]) ? baseUsers : []);
  if (gigs.length) {
    const users: User[] = gigs.map((gig: any) => ({
      id: gig.id.toString(),
      uid: gig.user?.uid,
      name: `${gig.user?.first_name ?? ""} ${gig.user?.last_name ?? ""}`.trim(),
      avatar: toImg(gig.user?.image),
      location: gig.category?.name ?? "—",
      badge: "Gig",
      hourlyRate: Number(gig.price) || 0,
      rating: 5,
      experience: gig.description?.slice(0, 40) + "…" || "—",
      followers: 0,
      skills: [...(gig.skills || []), ...(gig.tags || [])],
      bio: gig.description || "",
      projects: [],
    }));
    return { users, totalPages };
  }

  // Case 3: Jobs
  const jobs = res?.data?.jobs?.data || (baseUsers.length && isJobLike(baseUsers[0]) ? baseUsers : []);
  if (jobs.length) {
    const users: User[] = jobs.map((job: any) => ({
      id: job.id.toString(),
      uid: job.buyer?.uid,
      name: `${job.buyer?.first_name ?? ""} ${job.buyer?.last_name ?? ""}`.trim(),
      avatar: toImg(job.buyer?.image),
      location: job.category?.name ?? "—",
      badge: "Job",
      hourlyRate: Number(job.budget) || 0,
      rating: 0,
      experience: job.description?.slice(0, 40) + "…" || "—",
      followers: 0,
      skills: [...(job.skills || []), ...(job.tags || [])],
      bio: job.description || "",
      projects: [],
    }));
    return { users, totalPages };
  }

  // Fallback
  return { users: [], totalPages: 1 };
}
