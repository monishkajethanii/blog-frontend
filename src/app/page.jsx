"use client";
import React, { useEffect, useState } from "react";
import { Plus, X, Edit2, Trash2, MessageCircle, Search, Calendar, User, Hash, AlertCircle } from "lucide-react";

export default function BlogApp() {
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author: "",
    tags: "",
  });

  // Mock data for demonstration
  const mockBlogs = [
    {
      id: 1,
      title: "Getting Started with React",
      content: "React is a powerful library for building user interfaces. In this post, we'll explore the basics of React and how to get started with your first component.",
      author: "John Doe",
      tags: "react, javascript, tutorial",
      created_at: new Date().toISOString(),
      comments: "Great tutorial!,This helped me a lot,Thanks for sharing"
    },
    {
      id: 2,
      title: "CSS Grid vs Flexbox",
      content: "Understanding when to use CSS Grid and when to use Flexbox can be tricky. Let's break down the differences and use cases for each.",
      author: "Jane Smith",
      tags: "css, web design, layout",
      created_at: new Date().toISOString(),
      comments: ""
    }
  ];

  // Helper function to parse comments string into array
  const parseComments = (commentsString) => {
    if (!commentsString || commentsString.trim() === "") {
      return [];
    }
    return commentsString.split(',').map(comment => comment.trim()).filter(comment => comment.length > 0);
  };

  // Helper function to get comment count
  const getCommentCount = (blog) => {
    return parseComments(blog.comments || "").length;
  };

  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("http://localhost:5000/api/blogs", {
          headers: {
            Auth: "c3RvcmVhbmRjb25uZWN0IGlzIGJlc3Q=",
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("API Response:", data);
          setBlogs(data.data || []);
          setFilteredBlogs(data.data || []);
        } else {
          throw new Error(`API Error: ${response.status}`);
        }
      } catch (error) {
        console.log("API not available, using mock data:", error.message);
        setBlogs(mockBlogs);
        setFilteredBlogs(mockBlogs);
        setError("Using demo data - API not available");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  useEffect(() => {
    const filtered = blogs.filter(blog =>
      blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.tags?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBlogs(filtered);
  }, [searchTerm, blogs]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(""); // Clear errors when user types
  };

  const validateForm = () => {
    if (!formData.title?.trim()) {
      setError("Title is required");
      return false;
    }
    if (!formData.author?.trim()) {
      setError("Author is required");
      return false;
    }
    if (!formData.content?.trim()) {
      setError("Content is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      if (isEditMode && editingBlog) {
        // Edit mode - Update existing blog
        const url = `http://localhost:5000/api/editblog/${editingBlog.id}`;
        console.log("Updating blog:", { id: editingBlog.id, formData });
        
        try {
          const response = await fetch(url, {
            method: "PUT",
            headers: {
              Auth: "c3RvcmVhbmRjb25uZWN0IGlzIGJlc3Q=",
              "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log("Update response:", result);
            
            // Update the blog in state
            setBlogs(prev => prev.map(blog => 
              blog.id === editingBlog.id ? { ...blog, ...formData, updated_at: new Date().toISOString() } : blog
            ));
            
            setError(""); // Clear any previous errors
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Update failed: ${response.status}`);
          }
        } catch (apiError) {
          console.log("API not available, updating locally:", apiError.message);
          // Fallback: Update locally
          const updatedBlog = {
            ...editingBlog,
            ...formData,
            updated_at: new Date().toISOString()
          };
          setBlogs(prev => prev.map(blog => 
            blog.id === editingBlog.id ? updatedBlog : blog
          ));
          setError("Updated locally - API not available");
        }
      } else {
        // Create mode - Add new blog
        const url = "http://localhost:5000/api/addblog";
        console.log("Creating blog:", formData);
        
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              Auth: "c3RvcmVhbmRjb25uZWN0IGlzIGJlc3Q=",
              "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log("Create response:", result);
            setBlogs(prev => [result.data, ...prev]);
            setError(""); // Clear any previous errors
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Create failed: ${response.status}`);
          }
        } catch (apiError) {
          console.log("API not available, creating locally:", apiError.message);
          // Fallback: Create locally
          const newBlog = {
            id: Date.now(),
            ...formData,
            created_at: new Date().toISOString(),
            comments: []
          };
          setBlogs(prev => [newBlog, ...prev]);
          setError("Created locally - API not available");
        }
      }
      
      closeModal();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (blog) => {
    console.log("Editing blog:", blog);
    setIsEditMode(true);
    setEditingBlog(blog);
    setFormData({
      title: blog.title || "",
      content: blog.content || "",
      author: blog.author || "",
      tags: blog.tags || ""
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (blogId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      setError("");
      try {
        try {
          const response = await fetch(`http://localhost:5000/api/deleteblog/${blogId}`, {
            method: "DELETE",
            headers: {
              Auth: "c3RvcmVhbmRjb25uZWN0IGlzIGJlc3Q=",
            },
          });
          
          if (!response.ok) {
            throw new Error(`Delete failed: ${response.status}`);
          }
        } catch (apiError) {
          console.log("API not available, deleting locally:", apiError.message);
          setError("Deleted locally - API not available");
        }
        
        // Always update local state
        setBlogs(prev => prev.filter(blog => blog.id !== blogId));
      } catch (error) {
        console.error("Error deleting post:", error);
        setError("Failed to delete post");
      }
    }
  };

  const toggleComments = (blogId) => {
    setShowComments(prev => ({
      ...prev,
      [blogId]: !prev[blogId]
    }));
  };

  const handleCommentChange = (blogId, value) => {
    setNewComment(prev => ({
      ...prev,
      [blogId]: value
    }));
  };

  const addComment = async (blogId) => {
    const comments = newComment[blogId]?.trim();
    if (!comments) return;

    try {
      try {
        const response = await fetch(`http://localhost:5000/api/addcom/${blogId}`, {
          method: "POST",
          headers: {
            Auth: "c3RvcmVhbmRjb25uZWN0IGlzIGJlc3Q=",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ comments })
        });
        
        if (response.ok) {
          const result = await response.json();
          // Update the blog with the new comment appended to the string
          setBlogs(prev => prev.map(blog => {
            if (blog.id === blogId) {
              const existingComments = blog.comments || "";
              const updatedComments = existingComments 
                ? `${existingComments},${comments}`
                : comments;
              return { ...blog, comments: updatedComments };
            }
            return blog;
          }));
        } else {
          throw new Error('API comment failed');
        }
      } catch (apiError) {
        console.log("API not available, adding comment locally");
        // Fallback: Add comment locally to string
        setBlogs(prev => prev.map(blog => {
          if (blog.id === blogId) {
            const existingComments = blog.comments || "";
            const updatedComments = existingComments 
              ? `${existingComments},${comments}`
              : comments;
            return { ...blog, comments: updatedComments };
          }
          return blog;
        }));
      }
      
      setNewComment(prev => ({
        ...prev,
        [blogId]: ""
      }));
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingBlog(null);
    setFormData({ title: "", content: "", author: "", tags: "" });
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Error Banner */}
      {error && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <div className="ml-3">
              <p className="text-sm text-amber-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DevBlog
              </h1>
              <p className="text-gray-600 mt-1">Share your thoughts with the world</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
            >
              <Plus className="h-5 w-5" />
              <span>New Post</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditMode ? "Edit Post" : "Create New Post"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                disabled={isLoading}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Error Message in Modal */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., react, javascript, tutorial"
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows="6"
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium disabled:opacity-50 disabled:transform-none"
                >
                  {isLoading ? 'Processing...' : (isEditMode ? "Update Post" : "Create Post")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blog Posts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoading && blogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading blogs...</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
            {filteredBlogs.map((blog) => (
              <article key={blog.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
                <div className="p-6">
                  {/* Tags */}
                  {blog.tags && (
                    <div className="flex items-center gap-2 mb-4">
                      <Hash className="h-4 w-4 text-blue-500" />
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {blog.tags}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {blog.title || 'No title'}
                  </h2>

                  {/* Content Preview */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {blog.content}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{blog.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button
                      onClick={() => toggleComments(blog.id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{getCommentCount(blog)} Comments</span>
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(blog)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Post"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(blog.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {showComments[blog.id] && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      {/* Existing Comments */}
                      {parseComments(blog.comments).length > 0 && (
                        <div className="space-y-3 mb-4">
                          {parseComments(blog.comments).map((comment, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm text-gray-700">{comment}</p>
                              <span className="text-xs text-gray-500">
                                Just now
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={newComment[blog.id] || ""}
                          onChange={(e) => handleCommentChange(blog.id, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          onKeyPress={(e) => e.key === 'Enter' && addComment(blog.id)}
                        />
                        <button
                          onClick={() => addComment(blog.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {filteredBlogs.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No blogs found</h3>
            <p className="text-gray-500">
              {searchTerm ? "Try adjusting your search terms" : "Create your first blog post to get started"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}