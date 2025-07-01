import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "@/types/User";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
interface UserProfileDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
   gotoChat: (e: React.MouseEvent) => void;
}

const fallbackAvatar =
  "https://ui-avatars.com/api/?name=Unknown&background=ECECEC&color=555&size=128";

export default function UserProfileDialog({
  user,
  gotoChat,
  isOpen,
  onClose,
}: UserProfileDialogProps) {
  const { t } = useTranslation();
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {t("profile_details")}
          </DialogTitle>
        </DialogHeader>

        {/* -------- Header -------- */}
        <div className="flex items-start space-x-6">
          <img
            src={user.avatar || fallbackAvatar}
            alt={user.name}
            className="w-24 h-24 rounded-full object-cover shrink-0"
          />

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-bold text-gray-900">
                {user.name ?? t("unknown")}
              </h2>

              {user.rating !== undefined && (
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-500 text-xl">★</span>
                  <span className="text-xl font-semibold">
                    {user.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {user.location && (
              <p className="text-gray-600 mb-2">{user.location}</p>
            )}

            {user.badge && <Badge className="mb-4">{user.badge}</Badge>}

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {user.hourlyRate !== undefined && (
                <span>
                  {Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(user.hourlyRate)}
                  /{t("hour")}
                </span>
              )}
              {user.experience && <span>{user.experience}</span>}
              {user.followers !== undefined && (
                <span>{user.followers} {t("followers")}</span>
              )}
            </div>
          </div>
        </div>

        {/* -------- About -------- */}
        {user.bio && (
          <section>
            <h3 className="text-lg font-semibold mb-2">{t("about")}</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {user.bio}
            </p>
          </section>
        )}

        {/* -------- Skills -------- */}
        {user.skills?.length ? (
          <section>
            <h3 className="text-lg font-semibold mb-3">
              {t("skills_expertise")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="px-3 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}

        {/* -------- Projects -------- */}
        {user.projects?.length ? (
          <section>
            <h3 className="text-lg font-semibold mb-4">
              {t("featured_projects")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.projects.map((project, idx) => (
                <article
                  key={idx}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {project.image && (
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h4 className="font-semibold mb-2">{project.title}</h4>
                    {project.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                        {project.description}
                      </p>
                    )}
                    {project.tags?.length && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* -------- Contact -------- */}
        <div className="flex space-x-3 pt-6 border-t">
          <Button className="flex-1 bg-red-500 text-white hover:bg-gray-800" onClick={gotoChat}>
            {t("get_in_touch")}
          </Button>
          <Button variant="outline" className="flex-1">
            {t("follow")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
