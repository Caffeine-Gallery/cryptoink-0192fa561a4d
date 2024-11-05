import { backend } from "declarations/backend";

let quill;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Quill editor
    quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });

    // Load initial posts
    loadPosts();

    // Event Listeners
    document.getElementById('newPostBtn').addEventListener('click', showNewPostForm);
    document.getElementById('cancelBtn').addEventListener('click', hideNewPostForm);
    document.getElementById('postForm').addEventListener('submit', handleSubmit);
});

async function loadPosts() {
    const loading = document.getElementById('loading');
    const postsContainer = document.getElementById('posts');
    
    try {
        const posts = await backend.getPosts();
        loading.style.display = 'none';
        
        if (posts.length === 0) {
            postsContainer.innerHTML = '<p class="no-posts">No posts yet. Be the first to write something!</p>';
            return;
        }

        const postsHTML = posts.map(post => `
            <article class="post">
                <h2>${escapeHtml(post.title)}</h2>
                <div class="post-meta">
                    <span class="author">By ${escapeHtml(post.author)}</span>
                    <span class="date">${new Date(Number(post.timestamp) / 1000000).toLocaleDateString()}</span>
                </div>
                <div class="post-content">${post.body}</div>
            </article>
        `).join('');

        postsContainer.innerHTML = postsHTML;
    } catch (error) {
        loading.innerHTML = 'Error loading posts. Please try again later.';
        console.error('Error loading posts:', error);
    }
}

function showNewPostForm() {
    document.getElementById('newPostForm').classList.remove('hidden');
    quill.setContents([{ insert: '\n' }]);
    document.getElementById('postForm').reset();
}

function hideNewPostForm() {
    document.getElementById('newPostForm').classList.add('hidden');
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = 'Publishing...';

    try {
        const title = document.getElementById('title').value;
        const author = document.getElementById('author').value;
        const body = quill.root.innerHTML;

        await backend.createPost(title, body, author);
        hideNewPostForm();
        await loadPosts();
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post. Please try again.');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Publish';
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
