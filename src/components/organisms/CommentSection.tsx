"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Avatar } from "@/components/atoms/Avatar";
import { useToast } from "@/components/organisms/Toast";
import { commentService } from "@/services";
import type { Comment } from "@/types/api.types";
import { getImageUrl } from "@/lib/api";

interface CommentSectionProps {
    articleId: string;
}

const CommentItem: React.FC<{
    comment: Comment;
    onLike: (id: string) => void;
    onReply: (id: string) => void;
    isReply?: boolean;
}> = ({ comment, onLike, onReply, isReply = false }) => {

    // Explicitly handle "replies" which might not be in the strict Comment type but are returned by API
    const replies = (comment as any).replies as Comment[] | undefined;

    return (
        <div className={`${isReply ? 'mr-8 md:mr-12' : ''}`}>
            <div className="flex gap-3 md:gap-4">
                <Avatar
                    src={comment.author.avatar ? getImageUrl(comment.author.avatar) : undefined}
                    name={comment.author.name}
                    size="sm"
                />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">{comment.author.name}</span>
                        <span className="text-xs text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString("ar-YE")}
                        </span>
                    </div>

                    <p className="text-gray-700 text-sm leading-relaxed mb-2">
                        {comment.content}
                    </p>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => onLike(comment.id)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors"
                        >
                            <Icon name="ri-heart-line" size="sm" />
                            <span>{comment.likes}</span>
                        </button>

                        {!isReply && (
                            <button
                                onClick={() => onReply(comment.id)}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors"
                            >
                                <Icon name="ri-reply-line" size="sm" />
                                <span className="mr-1">رد</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Replies */}
            {replies && replies.length > 0 && (
                <div className="mt-4 space-y-4 border-r-2 border-gray-100 pr-4">
                    {replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            onLike={onLike}
                            onReply={onReply}
                            isReply
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const CommentSection: React.FC<CommentSectionProps> = ({
    articleId,
}) => {
    const { success, error: showError } = useToast();
    const queryClient = useQueryClient();
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");

    // Fetch Comments using commentService
    const { data, isLoading } = useQuery({
        queryKey: ["comments", articleId],
        queryFn: () => commentService.getComments({ articleId, perPage: 100 }), // Fetching reasonable amount
    });

    const comments = data?.data || [];

    // Create Comment Mutation
    const createCommentMutation = useMutation({
        mutationFn: (content: string) => commentService.addComment({ articleId, content }),
        onSuccess: () => {
            success("تم إضافة تعليقك بنجاح");
            setNewComment("");
            queryClient.invalidateQueries({ queryKey: ["comments", articleId] });
        },
        onError: (err: any) => {
            // Basic 401 check helper
            if (err?.response?.status === 401 || err?.status === 401) {
                showError("يجب تسجيل الدخول لإضافة تعليق");
            } else {
                showError("فشل إضافة التعليق: " + (err?.message || "خطأ غير معروف"));
            }
        },
    });

    // Reply Mutation
    const replyMutation = useMutation({
        mutationFn: ({ parentId, content }: { parentId: string; content: string }) =>
            commentService.addComment({ articleId, content, parentId }),
        onSuccess: () => {
            success("تم إضافة الرد بنجاح");
            setReplyContent("");
            setReplyingTo(null);
            queryClient.invalidateQueries({ queryKey: ["comments", articleId] });
        },
        onError: (err: any) => {
            if (err?.response?.status === 401 || err?.status === 401) {
                showError("يجب تسجيل الدخول للرد");
            } else {
                showError("فشل إضافة الرد");
            }
        },
    });

    // Like Mutation
    const likeMutation = useMutation({
        mutationFn: (id: string) => commentService.likeComment(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', articleId] }),
        onError: (err: any) => {
            if (err?.response?.status === 401 || err?.status === 401) {
                showError("يجب تسجيل الدخول للإعجاب");
            }
        }
    });

    const handleSubmitComment = () => {
        if (!newComment.trim()) return;
        createCommentMutation.mutate(newComment);
    };

    const handleSubmitReply = (parentId: string) => {
        if (!replyContent.trim()) return;
        replyMutation.mutate({ parentId, content: replyContent });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6" id="comments">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Icon name="ri-chat-3-line" className="text-primary" />
                    التعليقات ({comments.length})
                </h3>
            </div>

            {/* Add Comment Form */}
            <div className="mb-8">
                <div className="flex gap-3">
                    <Avatar placeholder size="sm" />
                    <div className="flex-1">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="اكتب تعليقك..."
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm resize-none"
                        />
                        <div className="flex justify-end mt-2">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSubmitComment}
                                disabled={!newComment.trim() || createCommentMutation.isPending}
                            >
                                {createCommentMutation.isPending ? "جاري الإرسال..." : "إرسال"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : comments.length > 0 ? (
                <div className="space-y-6">
                    {comments.map((comment: Comment) => (
                        <div key={comment.id}>
                            <CommentItem
                                comment={comment}
                                onLike={(id) => likeMutation.mutate(id)}
                                onReply={(id) => setReplyingTo(replyingTo === id ? null : id)}
                            />

                            {/* Reply Input */}
                            {replyingTo === comment.id && (
                                <div className="mt-4 mr-8 md:mr-12 flex gap-3">
                                    <Avatar placeholder size="sm" />
                                    <div className="flex-1">
                                        <textarea
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder="اكتب ردك..."
                                            rows={2}
                                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setReplyingTo(null)}
                                            >
                                                إلغاء
                                            </Button>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleSubmitReply(comment.id)}
                                                disabled={replyMutation.isPending}
                                            >
                                                رد
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <p>لا توجد تعليقات بعد. كن أول من يشارك!</p>
                </div>
            )}
        </div>
    );
};

export default CommentSection;
