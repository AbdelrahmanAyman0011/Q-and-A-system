import { initAuth, isLoggedIn, isAdmin, setupAutoTokenVerification } from './auth.js';
import { initUI, showSection, showPopup, showToast, hidePopup, showQuestionFormPopup, showAnswerFormPopup, hideQuestionFormPopup, hideAnswerFormPopup } from './ui.js';
import { setupQuestionForm } from './question.js';
import { setupAnswerForm } from './answer.js';
import { renderProfile } from './profile.js';
import { initAnimations } from './animations.js';
import { initSearch } from './search.js';
import { setupVoting } from './vote.js';
import { initSidebar } from './sidebar.js';
import { renderFeed, setupFilterButtons } from './feed.js';
import { initSecurity } from './security.js';
import { fetchAndRenderPopularTags } from './tags.js';
import { navigateToSection, hasPermission, checkPageAccess } from './routeProtection.js'; // Import route protection
import './fileUpload.js'; // Import file upload module
import { initProfileChanges } from './passwordChange.js';
import { initFetchInterceptor } from './utils/fetchInterceptor.js'; // Import fetch interceptor for global token handling

document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing main.js');
  // Initialize fetch interceptor to catch all expired tokens
  initFetchInterceptor();
  // Initialize authentication
  initAuth();
  // Set up automatic token verification
  setupAutoTokenVerification();

  // Check URL parameters for error messages
  const params = new URLSearchParams(window.location.search);
  if (params.has('error')) {
    const error = params.get('error');
    if (error === 'unauthorized') {
      showToast('error', 'Access denied: You do not have permission to access that page');
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
  
  initUI();
  initSidebar();
  setupQuestionForm();
  setupAnswerForm();
  initSearch();
  setupVoting(); // Call once here
  initAnimations();
  setupFilterButtons();
  renderFeed();
  fetchAndRenderPopularTags(); // Fetch and render popular tags
  initSecurity();
  initFacebookLikeFeedUI();
  setupAdminNav();
  setupProtectedRoutes(); // Setup route protection
  setupProfileTabs(); // Add this line to initialize profile tabs
  // Function to close the sidebar
  const sidebar = document.getElementById('sidebar');
  function closeSidebar() {
    if (sidebar) {
      gsap.to(sidebar, {
        x: '-100%',
        duration: 0.3,
        ease: 'power2.in',
      });
      
      // Also hide the overlay
      const overlay = document.getElementById('sidebarOverlay');
      if (overlay) {
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            overlay.classList.remove('open');
          },
        });
      }
      
      // Update aria attribute
      document.getElementById('sidebarLogoBtn')?.setAttribute('aria-expanded', 'false');
    }
  }

  // Initialize Facebook-like UI enhancements
  function initFacebookLikeFeedUI() {
    // Apply transition effects
    const feedContainer = document.getElementById('questionFeed');
    if (feedContainer) {
      feedContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }

    // Add scroll-to-top button
    const scrollToTop = document.createElement('button');
    scrollToTop.className = 'scroll-to-top fixed bottom-6 right-6 z-10 p-3 rounded-full bg-primary text-white shadow-lg transform transition-transform hover:scale-110 opacity-0 pointer-events-none';
    scrollToTop.setAttribute('aria-label', 'Scroll to top');
    scrollToTop.innerHTML = `
      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    `;
    document.body.appendChild(scrollToTop);

    // Show/hide scroll-to-top button based on scroll position
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        scrollToTop.classList.add('opacity-100');
        scrollToTop.classList.remove('opacity-0', 'pointer-events-none');
      } else {
        scrollToTop.classList.remove('opacity-100');
        scrollToTop.classList.add('opacity-0', 'pointer-events-none');
      }
    });

    // Scroll to top when button is clicked
    scrollToTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    // Setup dynamic event listeners for elements that may be added after initial load
    setupDynamicEventListeners();
  }

  // Setup event listeners for dynamically added elements
  function setupDynamicEventListeners() {
    // Use event delegation, excluding .reaction-btn
    document.addEventListener('click', (e) => {
      // Handle share button clicks
      if (e.target.closest('.share-btn') && !e.target.closest('.reaction-btn')) {
        const btn = e.target.closest('.share-btn');
        const card = btn.closest('.question-card');
        if (!card) return;

        const questionId = card.getAttribute('data-id');
        const title = card.querySelector('.card-title')?.textContent || 'Question';
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?q=${questionId}`;
        
        if (navigator.share) {
          navigator.share({
            title: title,
            text: `Check out this question: ${title}`,
            url: shareUrl
          }).catch(console.error);
        } else {
          navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('success', 'Link copied to clipboard');
          }).catch(() => {
            prompt('Copy this link:', shareUrl);
          });
        }
      }
      
      // Handle answer counter button clicks to toggle answers visibility
      if (e.target.closest('.answers-counter') && !e.target.closest('.reaction-btn')) {
        const btn = e.target.closest('.answers-counter');
        const card = btn.closest('.question-card');
        if (!card) return;
        
        const toggleBtn = card.querySelector('.toggle-answers');
        if (toggleBtn) {
          toggleBtn.click();
        }
      }
      
      // Handle dropdown toggles
      if (e.target.closest('.dropdown-toggle') && !e.target.closest('.reaction-btn')) {
        e.stopPropagation();
        const button = e.target.closest('.dropdown-toggle');
        const menu = button.nextElementSibling;
        
        document.querySelectorAll('.dropdown-menu').forEach(m => {
          if (m !== menu) m.classList.add('hidden');
        });
        
        menu.classList.toggle('hidden');
      }
      
      // Handle reply button clicks
      if (e.target.closest('.reply-btn') && !e.target.closest('.reaction-btn')) {
        const button = e.target.closest('.reply-btn');
        const answerId = button.getAttribute('data-answer-id');
        const answerCard = button.closest('.answer-card');
        
        if (!isLoggedIn()) {
          showPopup('login');
          return;
        }
        
        if (answerCard) {
          const answerUsername = answerCard.getAttribute('data-username');
          const answerUserId = answerCard.getAttribute('data-user-id');
          showReplyForm(button, answerId, answerUsername, answerUserId);
        }
      }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.add('hidden');
      });
    });
    
    // Setup sidebar ask question button
    document.getElementById('sidebarAskQuestion')?.addEventListener('click', () => {
      if (!hasPermission('questionForm')) {
        if (!isLoggedIn()) {
          showPopup('login');
        } else {
          showToast('error', 'You do not have permission to post questions');
        }
        return;
      }
      showSection('questionForm');
    });
    
    const questionFeed = document.getElementById('questionFeed');
    if (questionFeed) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1 && node.classList?.contains('question-card')) {
                setupLazyLoadingForCard(node);
              }
            });
          }
        });
      });
      
      observer.observe(questionFeed, { childList: true, subtree: false });
      
      questionFeed.querySelectorAll('.question-card').forEach(card => {
        setupLazyLoadingForCard(card);
      });
    }
  }
  
  function setupLazyLoadingForCard(card) {
    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          intersectionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    intersectionObserver.observe(card);
  }

  // Function to setup admin navigation
  function setupAdminNav() {
    const adminDashboardNav = document.getElementById('adminDashboardNav');
    if (adminDashboardNav) {
      // Show admin nav only for admin users
      if (isAdmin()) {
        adminDashboardNav.classList.remove('hidden');
      } else {
        adminDashboardNav.classList.add('hidden');
      }

      // Add click handler for admin dashboard
      adminDashboardNav.addEventListener('click', () => {
        if (!isAdmin()) {
          showToast('error', 'Access denied: Admin privileges required');
          return;
        }
        window.location.href = '/admin.html';
        closeSidebar();
      });
    }
  }

  // Setup protected navigation between sections
  function setupProtectedRoutes() {
    // Get current page path for page-level protection
    const currentPath = window.location.pathname;
    // Check if the current page is protected
    if (currentPath.includes('/admin.html') || currentPath.includes('/reports.html') || currentPath.includes('/test-security.html')) {
      (async () => {
        await checkPageAccess(currentPath);
      })();
    }
      // Handle all navigation buttons with route protection
    document.getElementById('feedNav')?.addEventListener('click', () => {
      // Feed section is public, no need for async
      navigateToSection('feedSection', showSection);
    });
      document.getElementById('profileNav')?.addEventListener('click', async () => {
      const success = await navigateToSection('profileSection', showSection);
      if (!success) {
        if (!isLoggedIn()) {
          showPopup('login');
        }
      } else {
        // Profile data should already be preloaded, but render it anyway
        renderProfile();
      }
    });
    
    document.getElementById('postQuestionNav')?.addEventListener('click', async () => {
      const success = await navigateToSection('questionForm', showSection);
      if (!success) {
        if (!isLoggedIn()) {
          showPopup('login');
        }
      }
    });
    
    document.getElementById('answerQuestionNav')?.addEventListener('click', async () => {
      const success = await navigateToSection('answerQuestionSection', showSection);
      if (!success) {
        if (!isLoggedIn()) {
          showPopup('login');
        }
      }
    });
    
    // Handle main content buttons that navigate to sections
    document.getElementById('postQuestionBtn')?.addEventListener('click', () => {
      if (!hasPermission('questionForm')) {
        if (!isLoggedIn()) {
          showPopup('login');
        } else {
          showToast('error', 'You must be an approved user to post questions');
        }
        return;
      }
      showSection('questionForm');
    });
    
    document.getElementById('answerQuestionBtn')?.addEventListener('click', () => {
      if (!hasPermission('answerQuestionSection')) {
        if (!isLoggedIn()) {
          showPopup('login');
        } else {
          showToast('error', 'You must be an approved user to answer questions');
        }
        return;
      }
      showSection('answerQuestionSection');
    });
      // Restore previous section from session storage if available
    const previousSection = sessionStorage.getItem('currentSection');
    if (previousSection) {
      if (hasPermission(previousSection)) {
        showSection(previousSection);
        
        // If restoring the profile section, we need to load profile data as well
        if (previousSection === 'profileSection') {
          renderProfile(); // Load profile data when restoring from session
          loadProfileSection(); // Initialize profile tabs and functionality
        }
      } else {
        showSection('feedSection'); // Default to feed if no permission
      }
    }
  }
  document.getElementById('postQuestionBtn')?.addEventListener('click', () => {
    console.log('Post Question button clicked');
    if (!isLoggedIn()) {
      showPopup('login');
    } else {
      // First make sure the feed section is visible
      const feedSection = document.getElementById('feedSection');
      if (feedSection) {
        document.querySelectorAll('main > section').forEach(section => {
          if (section !== feedSection) {
            section.classList.add('hidden');
          }
        });
        feedSection.classList.remove('hidden');
      }
      
      // Then show the popup
      showQuestionFormPopup();
      closeSidebar();
    }
  });
  document.getElementById('answerQuestionBtn')?.addEventListener('click', () => {
    console.log('Answer Question button clicked');
    if (!isLoggedIn()) {
      showPopup('login');
    } else {
      // First make sure the feed section is visible
      const feedSection = document.getElementById('feedSection');
      if (feedSection) {
        document.querySelectorAll('main > section').forEach(section => {
          if (section !== feedSection) {
            section.classList.add('hidden');
          }
        });
        feedSection.classList.remove('hidden');
      }
      
      // Then show the popup
      showAnswerFormPopup();
      closeSidebar();
    }
  });

  document.getElementById('feedNav')?.addEventListener('click', () => {
    console.log('Feed nav clicked');
    showSection('feedSection');
    renderFeed();
    closeSidebar();
  });

  document.getElementById('profileNav')?.addEventListener('click', async () => {
    console.log('Profile nav clicked');
    showSection('profileSection');
    await renderProfile();
    closeSidebar();
  });
  document.getElementById('postQuestionNav')?.addEventListener('click', () => {
    console.log('Post Question nav clicked');
    if (!isLoggedIn()) {
      showPopup('login');
    } else {
      // First make sure the feed section is visible
      const feedSection = document.getElementById('feedSection');
      if (feedSection) {
        document.querySelectorAll('main > section').forEach(section => {
          if (section !== feedSection) {
            section.classList.add('hidden');
          }
        });
        feedSection.classList.remove('hidden');
      }
      showQuestionFormPopup();
      closeSidebar();
    }
  });
  document.getElementById('answerQuestionNav')?.addEventListener('click', () => {
    console.log('Answer Question nav clicked');
    if (!isLoggedIn()) {
      showPopup('login');
    } else {
      // First make sure the feed section is visible
      const feedSection = document.getElementById('feedSection');
      if (feedSection) {
        document.querySelectorAll('main > section').forEach(section => {
          if (section !== feedSection) {
            section.classList.add('hidden');
          }
        });
        feedSection.classList.remove('hidden');
      }
      showAnswerFormPopup();
      closeSidebar();
    }
  });

  // Setup popup close buttons
  document.getElementById('closeQuestionFormBtn')?.addEventListener('click', hideQuestionFormPopup);
  document.getElementById('closeAnswerFormBtn')?.addEventListener('click', hideAnswerFormPopup);

  // This function gets called when profile section is loaded
  function loadProfileSection() {
    // Your existing profile section initialization code
    
    // Initialize both password and username change functionality
    initProfileChanges();
  }

  // Find where you show the profile section and call loadProfileSection
  const profileNav = document.getElementById('profileNav');
  if (profileNav) {
    const originalClickHandler = profileNav.onclick;
    
    profileNav.onclick = function(e) {
      // Call the original handler if it exists
      if (originalClickHandler) {
        originalClickHandler.call(this, e);
      }
      
      // Then initialize our password change functionality
      setTimeout(loadProfileSection, 100); // Small delay to ensure DOM is updated
    };
  }

  // Add this function before the end of the DOMContentLoaded event listener
  function setupProfileTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons and panels
        tabButtons.forEach(btn => {
          btn.classList.remove('active', 'border-primary', 'text-primary');
          btn.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
          btn.setAttribute('aria-selected', 'false');
        });
        tabPanels.forEach(panel => {
          panel.classList.add('hidden');
        });

        // Add active class to clicked button and corresponding panel
        button.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
        button.classList.add('active', 'border-primary', 'text-primary');
        button.setAttribute('aria-selected', 'true');

        const panelId = button.getAttribute('aria-controls');
        const panel = document.getElementById(panelId);
        if (panel) {
          panel.classList.remove('hidden');
        }
      });
    });
  }

  // Setup section change listener to initialize appropriate data when a section is shown
  document.addEventListener('sectionChanged', (event) => {
    const sectionId = event.detail.sectionId;
    console.log(`Section changed to: ${sectionId}`);
    
    // Load appropriate data based on which section is being shown
    if (sectionId === 'profileSection') {
      renderProfile(); // Load profile data
      loadProfileSection(); // Initialize profile tabs and functionality
    } else if (sectionId === 'feedSection') {
      renderFeed(); // Refresh feed data
    }
    // Add other section-specific initializations as needed
  });

});
