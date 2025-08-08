"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { Avatar } from "@heroui/react";
import { 
  MessageCircle,
  Send,
  Edit,
  Trash2,
  Reply,
  MoreVertical,
  Shield,
  Smile,
  Clock,
  X
} from "lucide-react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { generateAvatarDataURL } from "@/lib/avatarGenerator";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  user_id: string;
  user_email?: string;
  user_name?: string;
  is_admin?: boolean;
  parent_comment_id?: string;
  replies?: Comment[];
}

interface CommentSectionProps {
  courseId: string;
  sectionId?: string;
}

export default function CommentSection({ courseId, sectionId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyType, setReplyType] = useState<"anonymous" | "named">("named");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [commentType, setCommentType] = useState<"anonymous" | "named">("named");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await import("@/lib/supabase").then(m => m.supabase.auth.getUser());
        setUser(user);
        
        // Lataa kommentit jos käyttäjä on kirjautunut
        if (user) {
          loadComments();
        } else {
          loadComments();
        }
      } catch (error) {
        console.error("Virhe käyttäjän haussa:", error);
        loadComments();
      }
    };

    getUser();
  }, [courseId, sectionId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/comments?courseId=${courseId}&sectionId=${sectionId || ""}`);
      
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        // Jos API ei toimi, käytetään mock-dataa
        const mockComments: Comment[] = [
          {
            id: "1",
            content: "Tämä on erinomainen kurssi! Olen oppinut paljon.",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_edited: false,
            user_id: "user1",
            user_email: "opiskelija@esimerkki.fi",
            user_name: "Matti Meikäläinen",
            is_admin: false,
            replies: [
              {
                id: "1-1",
                content: "Kiitos vastauksesta! Olen samaa mieltä.",
                created_at: new Date(Date.now() - 3600000).toISOString(),
                updated_at: new Date(Date.now() - 3600000).toISOString(),
                is_edited: false,
                user_id: "user2",
                user_email: "admin@esimerkki.fi",
                user_name: "Admin Käyttäjä",
                is_admin: true,
                parent_comment_id: "1"
              }
            ]
          },
          {
            id: "2", 
            content: "Kiitos kurssista! Onko lisää materiaalia saatavilla?",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString(),
            is_edited: false,
            user_id: "user2",
            user_email: "admin@esimerkki.fi",
            user_name: "Admin Käyttäjä",
            is_admin: true,
            replies: []
          }
        ];
        setComments(mockComments);
      }
    } catch (error) {
      console.error("Virhe kommenttien lataamisessa:", error);
      // Käytetään mock-dataa virheen sattuessa
      const mockComments: Comment[] = [
        {
          id: "1",
          content: "Tämä on erinomainen kurssi! Olen oppinut paljon.",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_edited: false,
          user_id: "user1",
          user_email: "opiskelija@esimerkki.fi",
          user_name: "Matti Meikäläinen",
          is_admin: false,
          replies: [
            {
              id: "1-1",
              content: "Kiitos vastauksesta! Olen samaa mieltä.",
              created_at: new Date(Date.now() - 3600000).toISOString(),
              updated_at: new Date(Date.now() - 3600000).toISOString(),
              is_edited: false,
              user_id: "user2",
              user_email: "admin@esimerkki.fi",
              user_name: "Admin Käyttäjä",
              is_admin: true,
              parent_comment_id: "1"
            }
          ]
        },
        {
          id: "2", 
          content: "Kiitos kurssista! Onko lisää materiaalia saatavilla?",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          is_edited: false,
          user_id: "user2",
          user_email: "admin@esimerkki.fi",
          user_name: "Admin Käyttäjä",
          is_admin: true,
          replies: []
        }
      ];
      setComments(mockComments);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          courseId,
          sectionId,
          commentType
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Lisää uusi kommentti listaan
        if (data.comment) {
          setComments(prevComments => [data.comment, ...prevComments]);
        }
        setNewComment("");
      } else {
        console.error("Virhe kommentin lähettämisessä:", response.statusText);
      }
    } catch (error) {
      console.error("Virhe kommentin lähettämisessä:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent
        })
      });

      if (response.ok) {
        // Päivitä kommentti listassa
        setComments(prevComments => 
          prevComments.map(comment => 
            comment.id === commentId 
              ? { ...comment, content: editContent, is_edited: true, updated_at: new Date().toISOString() }
              : comment
          )
        );
        setEditingComment(null);
        setEditContent("");
      } else {
        console.error("Virhe kommentin muokkaamisessa:", response.statusText);
      }
    } catch (error) {
      console.error("Virhe kommentin muokkaamisessa:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        // Poista kommentti listasta
        setComments(prevComments => 
          prevComments.filter(comment => comment.id !== commentId)
        );
      } else {
        console.error("Virhe kommentin poistamisessa:", response.statusText);
      }
    } catch (error) {
      console.error("Virhe kommentin poistamisessa:", error);
    } finally {
      setIsLoading(false);
      setDeleteModalOpen(false);
      setCommentToDelete(null);
    }
  };

  const handleDeleteReply = async (parentCommentId: string, replyId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/comments/${replyId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        // Poista vastaus parent-kommentin replies-listasta
        setComments(prevComments => 
          prevComments.map(comment => 
            comment.id === parentCommentId 
              ? { 
                  ...comment, 
                  replies: comment.replies?.filter(reply => reply.id !== replyId) || []
                }
              : comment
          )
        );
      } else {
        console.error("Virhe vastauksen poistamisessa:", response.statusText);
      }
    } catch (error) {
      console.error("Virhe vastauksen poistamisessa:", error);
    } finally {
      setIsLoading(false);
      setDeleteModalOpen(false);
      setCommentToDelete(null);
    }
  };

  const openDeleteModal = (comment: Comment) => {
    setCommentToDelete(comment);
    setDeleteModalOpen(true);
  };

  const handleReply = async (commentId: string) => {
    if (!replyContent.trim()) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent,
          courseId,
          sectionId,
          parentCommentId: commentId,
          commentType: replyType
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Lisää vastaus oikeaan kommenttiin
        if (data.comment) {
          setComments(prevComments => 
            prevComments.map(comment => 
              comment.id === commentId 
                ? { 
                    ...comment, 
                    replies: [...(comment.replies || []), data.comment]
                  }
                : comment
            )
          );
        }
        setReplyingTo(null);
        setReplyContent("");
        setReplyType("named"); // Reset to default
      } else {
        console.error("Virhe vastauksen lähettämisessä:", response.statusText);
      }
    } catch (error) {
      console.error("Virhe vastauksen lähettämisessä:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return "juuri nyt";
    if (diffInHours < 24) return `${Math.floor(diffInHours)} tuntia sitten`;
    if (diffInHours < 48) return "eilen";
    
    return date.toLocaleDateString("fi-FI", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const canEditComment = (comment: Comment) => {
    return user?.id === comment.user_id || isAdmin();
  };

  const canDeleteComment = (comment: Comment) => {
    return user?.id === comment.user_id || isAdmin();
  };

  const isAdmin = () => {
    // Simple admin check - you can set this up in Supabase
    // For now, let's make it work for your email
    return user?.email === 'teemu.kinnunen@rapidly.fi' || 
           user?.user_metadata?.is_admin || 
           user?.user_metadata?.role === 'admin' ||
           false;
  };

  const commonEmojis = [
    "😊", "😄", "😍", "👍", "❤️", "🎉", "🔥", "💯", "✨", "🌟",
    "😎", "🤔", "😅", "😂", "🥰", "😘", "🤗", "👏", "🙌", "💪",
    "😢", "😭", "😡", "😤", "😴", "🤯", "😱", "🤩", "😇", "🤠"
  ];

  const handleEmojiSelect = (emoji: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter((prev: string) => prev + emoji);
  };

  if (!user) {
    return (
      <div className="bg-white border border-gray-200 p-8">
        <div className="text-center py-12">
          <div className="bg-gray-100 w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Kirjaudu sisään kommentoidaksesi</h3>
          <p className="text-gray-600 mb-6">Kirjaudu sisään nähdäksesi ja lisätäksesi kommentteja.</p>
          <Button 
            as="a" 
            href="/login"
            className="bg-red-800 hover:bg-red-900 text-white font-semibold px-8 py-3 transition-colors duration-200"
          >
            Kirjaudu sisään
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 p-8">
        {/* Kommenttiosion otsikko */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gray-100 w-12 h-12 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Kommentit ({comments.length})</h3>
            <p className="text-gray-600 text-sm">Jaa ajatuksesi ja kysy kysymyksiä</p>
          </div>
        </div>

        {/* Kommenttien lista */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Ladataan kommentteja...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Ei kommentteja vielä</h4>
            <p className="text-gray-600">Ole ensimmäinen kommentoija!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white border border-gray-200 p-6 mb-6 relative">
              {/* Delete button for admins */}
              {isAdmin() && (
                <button
                  onClick={() => openDeleteModal(comment)}
                  className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                  aria-label="Poista kommentti"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Avatar 
                    src={generateAvatarDataURL(comment.user_email || "", comment.user_id || "")}
                    name={comment.user_name?.[0] || "K"}
                    className="w-12 h-12 ring-2 ring-gray-100"
                    size="lg"
                    color={comment.is_admin ? "primary" : "default"}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Kommentin otsikko */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-base">
                          {comment.user_name}
                        </span>
                        {comment.is_admin && (
                          <span className="px-3 py-1 text-xs bg-red-800 text-white flex items-center gap-1 font-medium">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(comment.created_at)}</span>
                        {comment.is_edited && (
                          <span className="text-xs text-gray-400 ml-2">(muokattu)</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Toiminnot */}
                    {(canEditComment(comment) || canDeleteComment(comment)) && (
                      <Dropdown>
                        <DropdownTrigger>
                          <Button 
                            isIconOnly 
                            variant="light" 
                            size="sm" 
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                          {canEditComment(comment) && (
                            <DropdownItem
                              key="edit"
                              startContent={<Edit className="w-4 h-4" />}
                              onClick={() => {
                                setEditingComment(comment.id);
                                setEditContent(comment.content);
                              }}
                            >
                              Muokkaa
                            </DropdownItem>
                          )}
                          {canDeleteComment(comment) && (
                            <DropdownItem
                              key="delete"
                              startContent={<Trash2 className="w-4 h-4" />}
                              color="danger"
                              onClick={() => openDeleteModal(comment)}
                            >
                              {isAdmin() && comment.user_id !== user?.id ? "Poista kommentti (Admin)" : "Poista"}
                            </DropdownItem>
                          )}
                        </DropdownMenu>
                      </Dropdown>
                    )}
                  </div>

                  {/* Kommentin sisältö */}
                  <div className="text-gray-800 leading-relaxed mb-4">
                    {editingComment === comment.id ? (
                      <div className="space-y-4">
                        <div className="relative">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            placeholder="Muokkaa kommenttia..."
                            className="w-full min-h-[120px] resize-none pr-12 px-4 py-3 text-sm border border-gray-300 focus:border-red-800 focus:outline-none transition-colors duration-200"
                          />
                          <Popover placement="top-end">
                            <PopoverTrigger>
                              <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                              >
                                <Smile className="w-4 h-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4 bg-white border border-gray-200 shadow-xl">
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Valitse emoji</h4>
                                <div className="grid grid-cols-10 gap-2">
                                  {commonEmojis.map((emoji, index) => (
                                    <Button
                                      key={index}
                                      isIconOnly
                                      variant="light"
                                      size="sm"
                                      className="text-lg hover:bg-gray-100 transition-colors duration-150"
                                      onClick={() => handleEmojiSelect(emoji, setEditContent)}
                                    >
                                      {emoji}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            onClick={() => handleEditComment(comment.id)}
                            disabled={!editContent.trim() || isLoading}
                            className="bg-red-800 hover:bg-red-900 text-white font-medium px-6 transition-colors duration-200"
                          >
                            Tallenna
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            onClick={() => {
                              setEditingComment(null);
                              setEditContent("");
                            }}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            Peruuta
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4">
                        <p className="whitespace-pre-wrap text-gray-800">{comment.content}</p>
                      </div>
                    )}
                  </div>

                  {/* Vastaus-nappi */}
                  <div className="flex items-center gap-4">
                    <Button
                      size="sm"
                      variant="light"
                      startContent={<Reply className="w-4 h-4" />}
                      onClick={() => {
                        setReplyingTo(comment.id);
                        setReplyContent("");
                      }}
                      className="text-gray-600 hover:text-red-800 hover:bg-red-50 px-4 transition-colors duration-200"
                    >
                      Vastaa
                    </Button>
                  </div>

                  {/* Vastaukset */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="pl-6 border-l-2 border-gray-200 bg-gray-50 p-4">
                          <div className="flex items-start gap-3">
                            <Avatar 
                              src={generateAvatarDataURL(reply.user_email || "", reply.user_id || "")}
                              name={reply.user_name?.[0] || "K"}
                              className="flex-shrink-0 w-8 h-8 ring-2 ring-white"
                              size="sm"
                              color={reply.is_admin ? "primary" : "default"}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-sm text-gray-900">
                                  {reply.user_name}
                                </span>
                                {reply.is_admin && (
                                  <span className="px-2 py-1 text-xs bg-red-800 text-white flex items-center gap-1 font-medium">
                                    <Shield className="w-2 h-2" />
                                    Admin
                                  </span>
                                )}
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="w-2 h-2" />
                                  <span>{formatDate(reply.created_at)}</span>
                                  {reply.is_edited && (
                                    <span className="text-xs text-gray-400 ml-1">(muokattu)</span>
                                  )}
                                </div>
                              </div>
                              <div className="bg-white p-3 border border-gray-200">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{reply.content}</p>
                              </div>
                            </div>
                            
                            {/* Admin delete button for replies */}
                            {isAdmin() && (
                              <button
                                onClick={() => handleDeleteReply(comment.id, reply.id)}
                                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
                                aria-label="Poista vastaus"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Vastaus-lomake */}
                  {replyingTo === comment.id && (
                    <div className="mt-4 pl-6 border-l-2 border-gray-200 bg-gray-50 p-4">
                      <div className="flex gap-3">
                        <Avatar 
                          src={generateAvatarDataURL(user.email || "", user.id || "")}
                          name={user.user_metadata?.full_name?.[0] || user.email?.[0] || "K"}
                          className="flex-shrink-0 w-8 h-8 ring-2 ring-white"
                          size="sm"
                        />
                        <div className="flex-1 space-y-3">
                          {/* Vastauksen tyyppi */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700">Vastauksen tyyppi:</label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`replyType-${comment.id}`}
                                  value="named"
                                  checked={replyType === "named"}
                                  onChange={(e) => setReplyType(e.target.value as "anonymous" | "named")}
                                  className="w-3 h-3 text-red-800 border-gray-300 focus:ring-red-500"
                                />
                                <span className="text-xs text-gray-700">Nimellä</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`replyType-${comment.id}`}
                                  value="anonymous"
                                  checked={replyType === "anonymous"}
                                  onChange={(e) => setReplyType(e.target.value as "anonymous" | "named")}
                                  className="w-3 h-3 text-red-800 border-gray-300 focus:ring-red-500"
                                />
                                <span className="text-xs text-gray-700">Anonyymi</span>
                              </label>
                            </div>
                          </div>

                          <div className="relative">
                            <textarea
                              placeholder="Kirjoita vastauksesi... 😊"
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              className="w-full min-h-[80px] resize-none pr-12 px-4 py-3 text-sm border border-gray-300 focus:border-red-800 focus:outline-none transition-colors duration-200"
                            />
                            <Popover placement="top-end">
                              <PopoverTrigger>
                                <Button
                                  isIconOnly
                                  variant="light"
                                  size="sm"
                                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                >
                                  <Smile className="w-4 h-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-4 bg-white border border-gray-200 shadow-xl">
                                <div className="space-y-3">
                                  <h4 className="text-sm font-medium text-gray-900 mb-3">Valitse emoji</h4>
                                  <div className="grid grid-cols-10 gap-2">
                                    {commonEmojis.map((emoji, index) => (
                                      <Button
                                        key={index}
                                        isIconOnly
                                        variant="light"
                                        size="sm"
                                        className="text-lg hover:bg-gray-100 transition-colors duration-150"
                                        onClick={() => handleEmojiSelect(emoji, setReplyContent)}
                                      >
                                        {emoji}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              size="sm"
                              onClick={() => handleReply(comment.id)}
                              disabled={!replyContent.trim() || isLoading}
                              className="bg-red-800 hover:bg-red-900 text-white font-medium px-6 transition-colors duration-200"
                            >
                              Lähetä vastaus
                            </Button>
                            <Button
                              size="sm"
                              variant="light"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent("");
                              }}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Peruuta
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Uuden kommentin lomake */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex gap-4">
            <Avatar 
              src={generateAvatarDataURL(user.email || "", user.id || "")}
              name={user.user_metadata?.full_name?.[0] || user.email?.[0] || "K"}
              className="flex-shrink-0 w-12 h-12 ring-2 ring-gray-100"
              size="lg"
            />
            <div className="flex-1 space-y-4">
              {/* Kommenttityyppi */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Kommenttityyppi:</label>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="commentType"
                      value="named"
                      checked={commentType === "named"}
                      onChange={(e) => setCommentType(e.target.value as "anonymous" | "named")}
                      className="w-4 h-4 text-red-800 border-gray-300 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">Nimellä (suositus)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="commentType"
                      value="anonymous"
                      checked={commentType === "anonymous"}
                      onChange={(e) => setCommentType(e.target.value as "anonymous" | "named")}
                      className="w-4 h-4 text-red-800 border-gray-300 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">Anonyymi</span>
                  </label>
                </div>
              </div>

              {/* Kommenttikenttä */}
              <div className="relative">
                <textarea
                  placeholder="Kirjoita kommenttisi... 😊"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full min-h-[140px] resize-none pr-12 px-4 py-3 text-sm border border-gray-300 focus:border-red-800 focus:outline-none transition-colors duration-200"
                />
                <Popover placement="top-end">
                  <PopoverTrigger>
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4 bg-white border border-gray-200 shadow-xl">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Valitse emoji</h4>
                      <div className="grid grid-cols-10 gap-2">
                        {commonEmojis.map((emoji, index) => (
                          <Button
                            key={index}
                            isIconOnly
                            variant="light"
                            size="sm"
                            className="text-lg hover:bg-gray-100 transition-colors duration-150"
                            onClick={() => handleEmojiSelect(emoji, setNewComment)}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Lähetä-nappi */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isLoading}
                  className="bg-red-800 hover:bg-red-900 text-white font-semibold px-8 py-3 transition-colors duration-200"
                  startContent={<Send className="w-4 h-4" />}
                >
                  Lähetä kommentti
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <ModalContent className="max-w-sm mx-auto">
          <ModalHeader className="pb-2">
            <h3 className="text-base font-semibold text-gray-900">Poista kommentti</h3>
          </ModalHeader>
          <ModalBody className="pb-3">
            {commentToDelete && (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Haluatko varmasti poistaa kommentin käyttäjältä <strong>{commentToDelete.user_name}</strong>?
                </p>
                <div className="bg-gray-50 p-2 border border-gray-200">
                  <p className="text-xs text-gray-600 italic">&quot;{commentToDelete.content}&quot;</p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter className="pt-2">
            <Button
              variant="light"
              size="sm"
              onClick={() => {
                setDeleteModalOpen(false);
                setCommentToDelete(null);
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              Peruuta
            </Button>
            <Button
              color="danger"
              size="sm"
              onClick={() => commentToDelete && handleDeleteComment(commentToDelete.id)}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
              startContent={isLoading ? undefined : <Trash2 className="w-3 h-3" />}
            >
              {isLoading ? "Poistetaan..." : "Poista"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
