import { Bot } from 'grammy';
import { config } from '../config/env.js';
import { authMiddleware } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';

import { handleStart, handleHelp, handleCancel } from './handlers/start.js';
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
  handleAdminAddAdminPrompt,
  handleAdminManageAdmins,
  handleAdminRequestRemove,
  handleAdminConfirmMutation,
  handleAdminCancelMutation,
  handleAdminEditHistory
} from './handlers/admin.js';
import {
  handleAdminEditModeToggle,
  handleAdminEntityEditMenu,
  handleAdminEditFieldStart,
  handleAdminEditCancel,
  adminEditInputStates,
  processAdminEditInput
} from './handlers/adminEditor.js';

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

  // Commands
  bot.command('start', handleStart);
  bot.command('help', handleHelp);
  const cancelCurrentAction = async (ctx) => {
    if (ctx.from?.id) {
      adminActionStates.delete(ctx.from.id);
      adminEditInputStates.delete(ctx.from.id);
    }
    await handleCancel(ctx);
  };
  bot.command('cancel', cancelCurrentAction);
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
  bot.hears('❌ Bekor qilish', cancelCurrentAction);

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
  bot.callbackQuery('admin_edit_history', handleAdminEditHistory);
  bot.callbackQuery('admin_edit_mode_toggle', handleAdminEditModeToggle);
  bot.callbackQuery('admin_add_admin', handleAdminAddAdminPrompt);
  bot.callbackQuery('admin_manage_admins', handleAdminManageAdmins);
  bot.callbackQuery(/^admin_remove_admin:(\d+)$/, async (ctx) => {
    await handleAdminRequestRemove(ctx, ctx.match[1]);
  });
  bot.callbackQuery('admin_confirm_admin_change', handleAdminConfirmMutation);
  bot.callbackQuery('admin_cancel_admin_change', handleAdminCancelMutation);
  bot.callbackQuery(/^admin_edit:(department|subject|teacher|base|room|book|calendar|service):(\d+)$/, async (ctx) => {
    await handleAdminEntityEditMenu(ctx, ctx.match[1], Number(ctx.match[2]));
  });
  bot.callbackQuery(/^admin_edit_field:(department|subject|teacher|base|room|book|calendar|service):(\d+):([a-z_]+)$/, async (ctx) => {
    await handleAdminEditFieldStart(ctx, ctx.match[1], Number(ctx.match[2]), ctx.match[3]);
  });
  bot.callbackQuery('admin_edit_cancel', handleAdminEditCancel);

  // Generic text message handler
  bot.on('message:text', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    // Handle a pending field edit before other free-text admin actions.
    if (await processAdminEditInput(ctx)) return;

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
