# Preset Configuration

This document describes all 19 system presets that ship with LX Notes. These are read-only defaults created by the system; users can create custom presets based on these patterns.

## Overview

LX Notes uses three preset systems that work together to control how notes are filtered, formatted, and shared.

### Filter/Sort Presets

Control which notes appear and in what order. Used by the Print sidebar (to select notes for PDF) and the Email sidebar (to select notes for email). Scoped per module (cue, work, production).

**Configuration**: status filter, type filters, priority filters, sort field, sort direction, group-by-type toggle.

### Page Style Presets

Control PDF output layout. Used by the Print sidebar and the Email sidebar (when attaching a PDF). Global scope — apply to all modules.

**Configuration**: paper size, orientation, include-checkboxes toggle.

### Email Message Presets

Composable email templates that bundle email content together with optional references to a filter/sort preset and a page style preset. Scoped per module.

**Configuration**: recipients, subject, message body (with placeholders), includeNotesInBody, attachPdf, plus optional IDs referencing the other two preset types.

### How They Interact

```
┌─────────────────────────┐
│   Email Message Preset  │
│                         │
│  ┌─ filterSortPresetId ─┼──▶ Filter/Sort Preset
│  │                      │
│  └─ pageStylePresetId ──┼──▶ Page Style Preset
└─────────────────────────┘

Filter/Sort and Page Style presets are independent —
they do not reference each other.
```

### User Workflows

- **Print**: Select filter preset → select page style preset → generate PDF
- **Email**: Select email preset (auto-loads linked filter + page style) OR manually pick each → send

---

## Filter/Sort Presets (10)

Filter/sort presets control which notes are displayed and in what order. Each preset defines a status filter, included note types, included priority levels, sort field, sort direction, and whether to group by type.

### Cue Notes Module (4 presets)

**Outstanding Cues** — Shows only todo notes, sorted by priority (highest first), ungrouped. Includes all cue note types and all priority levels.

**High Priority First** — Shows notes of any status, sorted by priority (highest first), grouped by type. Includes all cue note types and all priority levels.

**All Todo Notes** — Shows only todo notes, sorted by cue number (ascending), ungrouped. Includes all cue note types and all priority levels.

**By Cue Number (Grouped)** — Shows only todo notes, sorted by cue number (ascending), grouped by type. Includes all cue note types and all priority levels.

> Cue note types: cue, director, choreographer, designer, stage_manager, associate, assistant, spot, programmer, production, paperwork, think
>
> Cue priority levels: critical, very_high, medium, low, very_low

### Production Notes Module (3 presets)

**Outstanding Issues** — Shows only todo notes, sorted by priority (highest first), ungrouped. Includes all department types and all priority levels.

**By Department** — Shows notes of any status, sorted by department (ascending), grouped by type. Includes all department types and all priority levels.

**All Todo Notes** — Shows only todo notes, sorted by creation date (newest first), ungrouped. Includes all department types and all priority levels.

> Production note types: scenic, costumes, lighting, props, sound, video, stage_management, directing, choreography, production_management
>
> Production priority levels: critical, very_high, medium, low, very_low

### Work Notes Module (3 presets)

**Outstanding Work** — Shows only todo notes, sorted by priority (highest first), ungrouped. Includes all work note types and all priority levels.

**By Channel** — Shows notes of any status, sorted by channel (ascending), ungrouped. Includes all work note types and all priority levels.

**All Todo Notes** — Shows only todo notes, sorted by position (ascending), ungrouped. Includes all work note types and all priority levels.

> Work note types: work, focus, paperwork, electrician, think
>
> Work priority levels: critical, very_high, high, medium_high, medium, medium_low, low, very_low, uncritical

---

## Page Style Presets (3)

Page style presets control PDF output layout. All three apply to every module.

**Letter Portrait** — US Letter paper (8.5 × 11 in), portrait orientation, checkboxes included.

**Letter Landscape** — US Letter paper (8.5 × 11 in), landscape orientation, checkboxes included.

**A4 Portrait** — A4 paper (210 × 297 mm), portrait orientation, checkboxes included.

---

## Email Message Presets (6)

Email message presets provide per-module templates for sending notes via email. Each module (Cue Notes, Work Notes, Production Notes) has two templates. Placeholders in `{{DOUBLE_BRACES}}` are resolved at send time.

### Daily Report (one per module)

- **Subject**: `{{PRODUCTION_TITLE}} - [Module] Daily Report for {{CURRENT_DATE}}`
- **Body**: Greeting, summary with `{{TODO_COUNT}}`, `{{COMPLETE_COUNT}}`, `{{NOTE_COUNT}}`, filter description, sign-off with `{{USER_FULL_NAME}}`
- Notes included in body: yes
- PDF attached: yes

### Tech Rehearsal (one per module)

- **Subject**: `{{PRODUCTION_TITLE}} - [Module] Tech Rehearsal {{CURRENT_DATE}}`
- **Body**: Brief message with `{{TODO_COUNT}}` priority items, sign-off with `{{USER_FULL_NAME}}`
- Notes included in body: no
- PDF attached: yes

---

## Email Placeholder Reference

| Placeholder | Description | Category |
|---|---|---|
| `{{PRODUCTION_TITLE}}` | Current production name | Production |
| `{{MODULE_NAME}}` | Current module (e.g., Cue Notes) | Production |
| `{{USER_FIRST_NAME}}` | Sender's first name | User |
| `{{USER_LAST_NAME}}` | Sender's last name | User |
| `{{USER_FULL_NAME}}` | Sender's full name | User |
| `{{CURRENT_DATE}}` | Today's date in readable format | Date |
| `{{CURRENT_TIME}}` | Current time | Date |
| `{{NOTE_COUNT}}` | Notes matching filter criteria | Notes |
| `{{TODO_COUNT}}` | Outstanding todo notes | Notes |
| `{{COMPLETE_COUNT}}` | Completed notes | Notes |
| `{{CANCELLED_COUNT}}` | Cancelled notes | Notes |
| `{{FILTER_DESCRIPTION}}` | Human-readable active filter description | Notes |
| `{{SORT_DESCRIPTION}}` | Sort method description | Notes |
| `{{DATE_RANGE}}` | Date range of included notes | Notes |
