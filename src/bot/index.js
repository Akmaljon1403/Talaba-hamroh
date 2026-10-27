import { Bot } from 'grammy';
import { config } from '../config/env.js';
import { authMiddleware } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';

import { handleStart, handleHelp, handleCancel, handleMyId } from './handlers/start.js';
import {
  handleAbout,
  handleAboutLeadership,
  handleAboutFaculties,
  handleAboutContacts,
  handleAboutLinks
} from './handlers/about.js';
import {
  handleLocations,
  handleBasesPagination,
  handleBaseDetail
} from './handlers/locations.js';
import {
  handleTeachers,
  handleDepartmentsPagination,
  handleDepartmentDetail
} from './handlers/teachers.js';
import {
  handleSchedule,
  handleCourseSchedule,
  handleScheduleDetail
} from './handlers/schedule.js';
import {
  handleLibrary,
  handleLibraryCourse
} from './handlers/library.js';
import {
  handleServices,
  handleServiceDetail
} from './handlers/services.js';
import {
  handleSearchPrompt,
  executeSearch
} from './handlers/search.js';
import {
  handleFeedbackPrompt,
  processFeedbackMessage,
  feedbackStates
} from './handlers/feedback.js';
import {
  handleAdminPanel,
  handleAdminStats,
  handleAdminUnanswered,
  handleAdminResolveUq,
  handleAdminFeedback,
  handleAdminMarkFeedback,
  handleAdminBroadcastPrompt,
  handleAdminAddBookPrompt,
  handleAdminAddTeacherPrompt,
  processAdminInput,
  adminActionStates,
  handleAdminAddPrompt,
  handleAdminList,
  handleAdminAddCancel,
  handleAdminConfirmAdd,
  handleAdminEditModeOn,
  handleAdminEditModeOff
} from './handlers/admin.js';
import { refreshAdminEditMode } from './utils/adminEditMode.js';
import {
  handleContentEditorHome,
  handleContentList,
  handleContentEditEntity,
  handleContentEditField,
  processContentEditInput,
  handleContentSaveConfirm,
  handleContentEditCancel
} from './handlers/contentEditor.js';

export function createBot(token = config.botToken) {
  if (!token) {
    throw new Error('Telegram bot tokeni ko\'rsatilmagan.');
  }

  const bot = new Bot(token);

  // Global error handler
  bot.catch(errorHandler);

  // Diagnostic middleware: log update arrival without logging message contents or user data.
  bot.use(async (ctx, next) => {
    const update = ctx.update;
    const updateType = update.message
      ? (update.message.text !== undefined ? 'message:text' : 'message:other')
      : update.callback_query
        ? 'callback_query'
        : update.edited_message
          ? 'edited_message'
          : update.inline_query
            ? 'inline_query'
            : Object.keys(update).find((key) => key !== 'update_id') || 'unknown';

    console.info(`[UPDATE RECEIVED] update_id=${update.update_id} type=${updateType}`);
    await next();
  });

  // Auth & tracking middleware
  bot.use(authMiddleware);

  // Keep the five-minute edit-mode timeout activity-based for each admin.
  bot.use(async (ctx, next) => {
    if (ctx.from && ctx.isAdmin && ctx.chat?.type === 'private') {
      refreshAdminEditMode(ctx.from.id, ctx.api, ctx.chat?.id);
    }
    await next();
  });

  // Commands
  bot.command('start', handleStart);
  bot.command('help', handleHelp);
  bot.command('cancel', handleCancel);
  bot.command('myid', handleMyId);
  bot.command('admin', handleAdminPanel);

  // Main menu text handlers
  bot.hears('🏛 Institut haqida', handleAbout);
  bot.hears('📍 Manzil va xonalar', handleLocations);
  bot.hears('👨‍🏫 O‘qituvchilar', handleTeachers);
  bot.hears('📚 Elektron kutubxona', handleLibrary);
  bot.hears('📅 O‘quv jadvali', handleSchedule);
  bot.hears('💡 Talaba xizmatlari', handleServices);
  bot.hears('🔍 Qidiruv', handleSearchPrompt);
  bot.hears('✍️ Fikr bildirish', handleFeedbackPrompt);
  bot.hears('⚙️ Admin boshqaruvi', handleAdminPanel);
  bot.hears('❌ Bekor qilish', handleCancel);

  // Inline callback query routers
  bot.callbackQuery('menu_home', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleStart(ctx);
  });

  bot.callbackQuery('noop', async (ctx) => {
    await ctx.answerCallbackQuery();
  });

  // About callbacks
  bot.callbackQuery('about_main', handleAbout);
  bot.callbackQuery('about_leadership', handleAboutLeadership);
  bot.callbackQuery('about_faculties', handleAboutFaculties);
  bot.callbackQuery('about_contacts', handleAboutContacts);
  bot.callbackQuery('about_links', handleAboutLinks);

  // Locations callbacks
  bot.callbackQuery('locations_main', handleLocations);
  bot.callbackQuery(/^bases:page:(\d+)$/, async (ctx) => {
    const page = parseInt(ctx.match[1], 10);
    await handleBasesPagination(ctx, page);
  });
  bot.callbackQuery(/^base_detail:(\d+)$/, async (ctx) => {
    const baseId = parseInt(ctx.match[1], 10);
    await handleBaseDetail(ctx, baseId);
  });
  bot.callbackQuery('search_room_prompt', handleSearchPrompt);

  // Teachers callbacks
  bot.callbackQuery('teachers_main', handleTeachers);
  bot.callbackQuery(/^depts:([a-z]+):page:(\d+)$/, async (ctx) => {
    const level = ctx.match[1];
    const page = parseInt(ctx.match[2], 10);
    await handleDepartmentsPagination(ctx, level, page);
  });
  bot.callbackQuery(/^dept_detail:(\d+)$/, async (ctx) => {
    const deptId = parseInt(ctx.match[1], 10);
    await handleDepartmentDetail(ctx, deptId);
  });
  bot.callbackQuery('search_teacher_prompt', handleSearchPrompt);

  // Schedule callbacks
  bot.callbackQuery('schedule_main', handleSchedule);
  bot.callbackQuery(/^sched_course:(\d+)$/, async (ctx) => {
    const course = parseInt(ctx.match[1], 10);
    await handleCourseSchedule(ctx, course);
  });
  bot.callbackQuery(/^sched_detail:(\d+)$/, async (ctx) => {
    const calId = parseInt(ctx.match[1], 10);
    await handleScheduleDetail(ctx, calId);
  });

  // Library callbacks
  bot.callbackQuery('library_main', handleLibrary);
  bot.callbackQuery(/^lib_course:(\d+)$/, async (ctx) => {
    const course = parseInt(ctx.match[1], 10);
    await handleLibraryCourse(ctx, course);
  });
  bot.callbackQuery('search_book_prompt', handleSearchPrompt);

  // Services callbacks
  bot.callbackQuery('services_main', handleServices);
  bot.callbackQuery(/^service_detail:([a-z_]+)$/, async (ctx) => {
    const cat = ctx.match[1];
    await handleServiceDetail(ctx, cat);
  });

  // Search callback
  bot.callbackQuery('search_prompt', handleSearchPrompt);

  // Admin callbacks
  bot.callbackQuery('admin_panel', handleAdminPanel);
  bot.callbackQuery('admin_stats', handleAdminStats);
  bot.callbackQuery('admin_unanswered', handleAdminUnanswered);
  bot.callbackQuery(/^admin_resolve_uq:(\d+)$/, async (ctx) => {
    const uqId = parseInt(ctx.match[1], 10);
    await handleAdminResolveUq(ctx, uqId);
  });
  bot.callbackQuery('admin_feedback', handleAdminFeedback);
  bot.callbackQuery(/^admin_mark_feedback:(\d+)$/, async (ctx) => {
    const feedbackId = parseInt(ctx.match[1], 10);
    await handleAdminMarkFeedback(ctx, feedbackId);
  });
  bot.callbackQuery('admin_broadcast', handleAdminBroadcastPrompt);
  bot.callbackQuery('admin_add_book', handleAdminAddBookPrompt);
  bot.callbackQuery('admin_add_teacher', handleAdminAddTeacherPrompt);

  // Admin provisioning and inactivity-expiring edit mode
  bot.callbackQuery('admin_add', handleAdminAddPrompt);
  bot.callbackQuery('admin_list', handleAdminList);
  bot.callbackQuery('admin_add_confirm', handleAdminConfirmAdd);
  bot.callbackQuery('admin_add_cancel', handleAdminAddCancel);
  bot.callbackQuery('admin_edit_mode_on', handleAdminEditModeOn);
  bot.callbackQuery('admin_edit_mode_off', handleAdminEditModeOff);

  // Content editor routes. Entity type and field are validated against server-side allowlists.
  bot.callbackQuery('content_editor_home', handleContentEditorHome);
  bot.callbackQuery(/^content_list:([a-z_]+):(\d+)$/, async (ctx) => {
    await handleContentList(ctx, ctx.match[1], parseInt(ctx.match[2], 10));
  });
  bot.callbackQuery(/^content_edit:([a-z_]+):(\d+)$/, async (ctx) => {
    await handleContentEditEntity(ctx, ctx.match[1], parseInt(ctx.match[2], 10));
  });
  bot.callbackQuery(/^content_field:([a-z_]+):(\d+):([a-z_]+)$/, async (ctx) => {
    await handleContentEditField(ctx, ctx.match[1], parseInt(ctx.match[2], 10), ctx.match[3]);
  });
  bot.callbackQuery('content_save_confirm', handleContentSaveConfirm);
  bot.callbackQuery('content_edit_cancel', handleContentEditCancel);

  // Generic text message handler
  bot.on('message:text', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    // Pending content edits take priority over ordinary search text.
    const contentEditHandled = await processContentEditInput(ctx);
    if (contentEditHandled) return;

    // Check if in admin input mode
    if (adminActionStates.has(userId)) {
      const handled = await processAdminInput(ctx);
      if (handled) return;
    }

    // Check if in feedback mode
    if (feedbackStates.has(userId)) {
      const handled = await processFeedbackMessage(ctx);
      if (handled) return;
    }

    // Default: treat as search query!
    await executeSearch(ctx, ctx.message.text);
  });

  return bot;
}
