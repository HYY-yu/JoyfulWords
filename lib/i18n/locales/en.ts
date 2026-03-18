export const en = {
    common: {
        doing: "Doing...",
        comingSoon: "Coming soon...",
        notFound: "Page Not Found",
        notFoundDesc: "Unable to find the corresponding functional module",
        version: "Version",
        generating: "Generating...",
        submit: "Submit",
        cancel: "Cancel",
        confirm: "Confirm",
        delete: "Delete",
        edit: "Edit",
        save: "Save",
        saving: "Saving...",
        preview: "Preview",
        or: "Or",
        zh: "中文",
        en: "English",
        account: "Account",
        aiHelp: "AI Writing Assistant",
        refresh: "refresh",
        feedback: "Feedback",
        feedbackButton: "Feedback",
        feedbackTitle: "Send Feedback",
        feedbackLoading: "Loading...",
        dateRange: {
            selectDate: "Select date range",
            from: "From",
            to: "To",
            quickSelect: "Quick Select",
            today: "Today",
            yesterday: "Yesterday",
            last7Days: "Last 7 days",
            last30Days: "Last 30 days",
            thisWeek: "This week",
            lastWeek: "Last week",
            thisMonth: "This month",
            lastMonth: "Last month",
            thisYear: "This year",
            lastYear: "Last year",
            custom: "Custom",
            clear: "Clear",
            cancel: "Cancel",
            confirm: "Confirm",
        },
        infiniteScroll: {
            loading: "Loading...",
            noMoreData: "All data loaded",
            loadFailed: "Load failed, tap to retry",
            error: "Load error: {error}",
        },
    },
    sidebar: {
        title: "Creator Toolbox",
        subtitle: "Content Creator Tools",
        joyfulWords: "JoyfulWords",
        contentWriting: "Content Writing",
        imageGeneration: "Image Gen",
        knowledgeCards: "Knowledge Cards",
        seoGeo: "SEO/GEO",
        videoEditing: "Video Editing",
        billing: "Billing & Credit",
    },
    contentWriting: {
        title: "Content Writing",
        subtitle: "Content creation and management tools",
        tabs: {
            materialSearch: "Materials",
            competitorTracking: "Competitors",
            articleWriting: "Writing",
            articleManager: "Articles",
        },
        materials: {
            types: {
                all: "All Types",
                info: "Info",
                news: "News",
                image: "Image",
            },
            toast: {
                fetchListFailed: "Failed to fetch materials list",
                fetchLogsFailed: "Failed to fetch search logs",
                searchCompleted: "Search completed",
                searchStartFailed: "Failed to start search",
                searchStarted: "Search started",
                searchStartedDesc: "AI is searching for related materials, please wait...",
                deleteFailed: "Failed to delete material",
                deleteSuccess: "Material deleted successfully",
                updateFailed: "Failed to update material",
                updateSuccess: "Material updated successfully",
                createSuccess: "Material created successfully",
                createSuccessDesc: "Material \"{name}\" has been successfully added to the list",
                createFailed: "Failed to create material",
            },
            searchBtn: "Search",
            searchingBtn: "Searching...",
            searchPlaceholder: "Search {type}...",
            aiSearching: "AI is searching hard, please wait...",
            filterName: "Material Name:",
            filterNamePlaceholder: "Search material name...",
            filterType: "Material Type:",
            uploadBtn: "Upload Material",
            table: {
                name: "Name",
                type: "Type",
                link: "Link",
                content: "Content",
                time: "Created At",
                actions: "Actions",
                noData: "No material data available",
                clickToView: "Click to view full content",
                clickToViewLinks: "Click to view all links",
                links: "links",
            },
            preview: {
                imageTitle: "Image Preview",
                textContent: "Full Content",
                linksTitle: "Related Links",
            },
            dialog: {
                editTitle: "Edit Material",
                editDesc: "Modify detailed material information",
                uploadTitle: "Upload Material",
                uploadDesc: "Add new material to your library",
                deleteTitle: "Confirm Delete",
                deleteDesc: "This action cannot be undone. Are you sure you want to delete this material?",
                nameLabel: "Material Name",
                typeLabel: "Material Type",
                linkLabel: "Material Link",
                contentLabel: "Material Content",
                namePlaceholder: "Please enter material name",
                contentPlaceholder: "Please enter material description...",
                saveBtn: "Save Changes",
                typeHintInfo: "Upload text resources and documentation",
                typeHintImage: "Upload image material (single image only)",
                imageLabel: "Image File",
                uploadHint: "Click to upload or drag image here",
                uploadFormatHint: "Supports PNG, JPG, JPEG formats, max 5MB",
                selectImageBtn: "Select Image",
                removeImageBtn: "Remove",
                fileName: "File name:",
            },
            errors: {
                invalidImageType: "Please select an image file",
                imageTooLarge: "Image size cannot exceed 5MB",
                searchTooShort: "Your search query is too short. Please enter more specific search terms for better results",
            },
            logs: {
                tabs: {
                    materials: "Materials",
                    logs: "Generation Logs",
                },
                filterType: "Type:",
                filterStatus: "Status:",
                table: {
                    id: "ID",
                    type: "Type",
                    status: "Status",
                    query: "Query",
                    createdAt: "Created At",
                    updatedAt: "Updated At",
                    noData: "No generation logs available",
                },
                types: {
                    all: "All",
                    info: "Info",
                    news: "News",
                    image: "Image",
                },
                status: {
                    all: "All",
                    doing: "Doing",
                    success: "Success",
                    failed: "Failed",
                    nodata: "No Data",
                },
            },
            pagination: {
                perPage: "Per page",
                items: "items",
                totalInfo: "Total {total}, Page {page}",
                pageOf: "/",
            },
        },
        competitors: {
            toast: {
                fetchTasksFailed: "Failed to fetch scheduled tasks",
                fetchResultsFailed: "Failed to fetch crawl results",
                fetchLogsFailed: "Failed to fetch crawl logs",
                urlRequired: "URL cannot be empty",
                urlRequiredDesc: "Please enter the URL to crawl",
                fetchStartFailed: "Failed to start crawling",
                fetchStarted: "Crawling started",
                scheduleCreateFailed: "Failed to create scheduled task",
                scheduleCreateSuccess: "Scheduled task created successfully",
                statusUpdateFailed: "Failed to update task status",
                statusUpdateSuccess: "Task status updated successfully",
                deleteFailed: "Failed to delete task",
                deleteSuccess: "Task deleted successfully",
                notSupported: "Direct modification not supported",
                notSupportedDesc: "Please delete the old task and create a new one",
            },
            urlType: {
                label: "URL Type",
                profile: "Profile Page",
                post: "Post Link",
            },
            tabs: {
                tasks: "Scheduled Tasks",
                results: "Crawl Results",
                logs: "Crawl Logs",
            },
            crawlBtn: "Crawl",
            timerCrawlBtn: "Scheduled Crawl",
            aiSearching: "AI is searching hard, please wait...",
            table: {
                platform: "Platform",
                url: "URL",
                interval: "Interval",
                lastRun: "Last Run",
                nextRun: "Next Run",
                status: "Status (Click to toggle)",
                actions: "Actions",
                noTasks: "No scheduled tasks",
                noResults: "No crawl results",
                running: "Running",
                paused: "Paused",
                loading: "Loading...",
                likes: "Likes",
                comments: "Comments",
                clickToViewContent: "Click to view full content",
                contentDialogTitle: "Full Content",
            },
            logs: {
                table: {
                    id: "Log ID",
                    snapshotId: "Snapshot ID",
                    status: "Status",
                    createdAt: "Created At",
                    updatedAt: "Updated At",
                    noData: "No crawl logs",
                },
                status: {
                    pending: "Pending",
                    doing: "Doing",
                    success: "Success",
                    failed: "Failed",
                },
            },
            dialog: {
                editInterval: "Edit Interval",
                configTask: "Configure Scheduled Crawl",
                editDesc: "Modify the time interval for scheduled crawling",
                configDesc: "Set the time interval for automatic crawling",
                modeSimple: "Simple Setting",
                modeCron: "Custom Cron Expression",
                intervalNum: "Interval Number",
                unit: "Unit",
                unitHours: "Hours",
                unitDays: "Days",
                confirmDeleteTitle: "Confirm Delete",
                confirmDeleteDesc: "Are you sure you want to delete this? This action cannot be undone.",
            },
            pagination: {
                perPage: "Per page",
                items: "items",
                totalInfo: "Total {total}, Page {page}",
                pageOf: "/",
            },
        },
        writing: {
            toast: {
                warning: "Warning",
                autoSaveFailed: "Auto-save failed",
                editorNotReady: "Editor not initialized, please try again later",
                imageInserted: "Image inserted into editor",
                selectTextFirst: "Please select text first",
                selectTextFirstDesc: "Please select the text you want to rewrite in the editor",
            },
            exportMarkdown: "Export as Markdown",
            exportHtml: "Export as HTML",
            editorPlaceholder: "Write your article content here...",
            uploading: "Uploading...",
            uploadSuccess: "Image uploaded successfully",
            uploadFailed: "Image upload failed",
            uploadError: "Upload failed: {error}",
        },
        aiHelp: {
            title: "AI Writing Assistant",
            description: "Select materials and competitors to let AI help you create articles",
            materialLabel: "Select Materials",
            materialPlaceholder: "Search materials...",
            competitorLabel: "Select Competitors",
            competitorPlaceholder: "Search competitors...",
            promptLabel: "Your Requirements",
            promptPlaceholder: "Describe what you want the article to be about...",
            promptRequired: "Please enter your requirements or select materials/competitors",
            selectedMaterials: "Selected {count} materials",
            selectedCompetitor: "Selected Competitor",
            generatingBtn: "Generating...",
            cancelBtn: "Cancel",
            confirmBtn: "Confirm Generate",
            success: "Article created, generating content...",
            loadMaterialsFailed: "Failed to load materials",
            loadCompetitorsFailed: "Failed to load competitors",
            generateFailed: "Generation failed, please try again",
            fileUploadLabel: "Upload Competitor Article",
            fileUploadHint: "Supports PDF, PNG, JPG/JPEG formats, max 5MB. Uploading will clear competitor selection.",
            invalidFileType: "Only PDF, PNG, JPG/JPEG formats are supported",
            fileTooLarge: "File size cannot exceed 5MB",
            uploadFailed: "File upload failed, please try again",
            uploadSuccess: "File uploaded successfully",
            uploading: "Uploading...",
            removeFile: "Remove File",
            uploadedFile: "Uploaded File",
            uploadInProgress: "File upload in progress, please wait...",
            materialsLoading: "Loading materials...",
            competitorsLoading: "Loading competitors...",
            noMoreMaterials: "All materials loaded",
            noMoreCompetitors: "All competitors loaded",
        },
        saveDialog: {
            title: "Save Article",
            description: "Fill in basic information for your article",
            titleLabel: "Article Title",
            titlePlaceholder: "Enter article title",
            titleRequired: "Please enter article title",
            categoryLabel: "Category",
            categoryPlaceholder: "Select category",
            characters: "characters",
            tagsLabel: "Tags",
            tagsPlaceholder: "Enter tags separated by commas",
            tagsHint: "Separate multiple tags with commas, e.g.: AI, Content Creation, Technology",
            saveBtn: "Save",
            cancelBtn: "Cancel",
            saving: "Saving...",
            saveFailed: "Save failed, please try again",
            success: "Article saved",
            saveAndNavigateSuccess: "Article saved, navigating to article management...",
        },
        editorHeader: {
            newArticle: "New Article",
            editMode: "Edit Mode",
            createMode: "Create Mode",
            showDetails: "Show Details",
            hideDetails: "Hide Details",
            cleanTooltip: "Clear all content and return to create mode",
            saveTooltip: "Save as new article",
            exportTooltip: "Export article",
            cleanConfirmTitle: "Confirm Clear",
            cleanConfirmDesc: "Are you sure you want to clear all content? This action cannot be undone.",
            detailsCreatedAt: "Created At",
            detailsModifiedAt: "Modified At",
            detailsCategory: "Category",
            detailsTags: "Tags",
            draftRestored: "Previous content restored",
            contentTooLarge: "Article content is too large, may not auto-save",
            autoSaveFailed: "Auto-save failed, please export manually",
            cleanSuccess: "All content cleared",
            saveMetadataSuccess: "Saved successfully",
            saveMetadataFailed: "Save failed",
            categoryPlaceholder: "Optional",
            tagsPlaceholder: "Optional, e.g.: AI, Tech, Future",
        },
        manager: {
            toast: {
                loadFailed: "Failed to load",
                deleteFailed: "Failed to delete article",
                deleteSuccess: "Article deleted successfully",
                updateFailed: "Failed to update article",
                updateSuccess: "Article updated successfully",
                statusUpdateFailed: "Failed to update status",
                statusUpdateSuccess: "Status updated successfully",
                aiWriteStartFailed: "AI writing failed to start",
                aiWriteStartedDesc: "Article is being generated, please wait...",
            },
            filterTitle: "Article Title:",
            filterStatus: "Status:",
            searchTitlePlaceholder: "Search article title...",
            totalCount: "Total {total} articles",
            status: {
                all: "All Status",
                init: "Initializing",
                published: "Published",
                draft: "Draft",
                archived: "Archived",
            },
            table: {
                title: "Title",
                content: "Content",
                images: "Images",
                status: "Status",
                materials: "Materials",
                posts: "Posts",
                created: "Created At",
                modified: "Modified At",
                actions: "Actions",
            },
            clickForDetail: "Click for details",
            clickForEdit: "Click to edit",
            emptyTitle: "No Articles",
            loading: "Loading...",
            perPage: "Per page",
            items: "items",
            materialsCount: "{count} materials",
            titleUpdated: "Title updated",
        },
        articleDialogs: {
            editTitle: {
                title: "Edit Article Title",
                label: "Title",
                placeholder: "Enter article title",
                hint: "Press Enter to save, Esc to cancel",
            },
            deleteConfirm: {
                title: "Confirm Delete",
                confirmBtn: "Delete Article",
                cancelBtn: "Cancel",
            },
            publishManagement: {
                title: "Publish Management",
                statusTitle: "Doing...",
                statusDesc: "Publish management feature is under development, stay tuned",
                confirmBtn: "Got it",
            },
            translation: {
                title: "Translation",
                statusTitle: "Doing...",
                statusDesc: "Translation feature is under development, stay tuned",
                confirmBtn: "Got it",
            },
            materialsLinks: {
                title: "Other Materials",
                type: "Type",
            },
            posts: {
                title: "Competitor Articles",
                platform: "Platform",
                viewOriginal: "View Original",
            },
        },
    },
    imageGeneration: {
        title: "Image Generation",
        subtitle: "AI-powered image generation tools",
        placeholder: "Describe the image you want to generate...",
        uploadRef: "Upload reference image",
        examples: "Examples",
        toolbar: {
            select: "Select",
            rectangle: "Rectangle",
            delete: "Delete",
            reset: "Reset Canvas",
        },
        modeTabs: {
            creation: "Creation",
            style: "Style",
            inversion: "Inversion",
            history: "History",
        },

        // 新增：模型选择器
        model: {
            title: "AI Model",
            selectPlaceholder: "Select a model",
            noModelsAvailable: "No models available",
            fetchFailed: "Failed to load models",
        },

        canvas: {
            previewJson: "Preview JSON",
            addLayerFirst: "Please add at least one layer first",
            toolHints: {
                select: "Click to select layer, drag to move position",
                rectangle: "Click on canvas to add rectangle",
                delete: "Click layer to delete, can delete multiple layers",
            },
            generateImage: "Generate Image",
            generating: "Generating...",
            viewOriginal: "View Original",
            saveToMaterials: "Save to Materials",
            laterImplementation: "Coming Soon",
            showGeneratedImage: "Show Generated Image",
            emptyState: {
                title: "Canvas Empty",
                description: "Start creating by selecting the rectangle tool from the left",
            },
            layerLabel: "Layer {number}",
        },
        properties: {
            description: "Description",
            descriptionPlaceholder: "Enter layer description...",
            descriptionRequired: "Description is required for generating image content",
            // 节标题
            metadata: "Metadata",
            selectedLayer: "Selected Layer Properties",
            globalStyle: "Global Style",
            composition: "Composition Settings",

            // 元数据
            width: "Width",
            height: "Height",
            seed: "Random Seed",
            seedHint: "Set to -1 for random seed",
            model: "AI Model",

            // 图层属性
            descriptionLabel: "Description",
            descriptionPlaceholder2: "Please enter layer description...",
            descriptionRequired2: "Required",
            referenceImage: "Reference Image",
            referenceImageOptional: "(Optional)",
            selectReferenceImage: "Select Reference Image",
            selectImageFromMaterials: "Select from materials",
            noImageMaterials: "No image materials available. Please upload in materials module first.",
            imageSelected: "Selected: ",
            materialsLoading: "Loading materials...",
            noMoreMaterials: "All materials loaded",
            zIndex: "Z-Index",
            infoBox: "Hint: Select a rectangle layer on the canvas to edit its properties",

            // 全局样式
            medium: "Art Medium",
            selectMedium: "Select art medium",
            style: "Art Style",
            selectStyle: "Select art style",
            colorAccent: "Color Accent",
            selectColorAccent: "Select color accent",

            // 艺术媒介选项
            mediums: {
                photography: "Photography",
                digitalIllustration: "Digital Illustration",
                oilPainting: "Oil Painting",
                watercolor: "Watercolor",
                render3d: "3D Render",
                sketch: "Sketch",
                glass: "Glass",
            },

            // 艺术风格选项
            styles: {
                renaissance: "Renaissance",
                impressionism: "Impressionism",
                surrealism: "Surrealism",
                minimalism: "Minimalism",
                baroque: "Baroque",
                ukiyoe: "Ukiyo-e",
                vaporwave: "Vaporwave",
                cyberpunk: "Cyberpunk",
                ghibli: "Ghibli",
            },

            // 色调选项
            colorAccents: {
                monochrome: "Monochrome",
                coolTones: "Cool Tones",
                warmTones: "Warm Tones",
                morandi: "Morandi",
                pastel: "Pastel",
                cinematic: "Cinematic Teal & Orange",
                neon: "Neon",
                earthTones: "Earth Tones",
                highContrast: "High Contrast",
            },

            // 构图设置
            camera: "Camera",
            angle: "Camera Angle",
            selectAngle: "Select camera angle",
            angles: {
                eyeLevel: "Eye Level",
                lowAngle: "Low Angle",
                highAngle: "High Angle",
                topDown: "Top-Down",
                dutchAngle: "Dutch Angle",
            },
            focalLength: "Focal Length",
            selectFocalLength: "Select focal length",
            focalLengths: {
                "14mm": "14mm (Ultra Wide)",
                "35mm": "35mm (Wide Angle)",
                "50mm": "50mm (Standard)",
                "85mm": "85mm (Portrait)",
                "200mm": "200mm (Telephoto)",
            },
            depthOfField: "Depth of Field",
            selectDepthOfField: "Select depth of field",
            depths: {
                shallow: "Shallow",
                deep: "Deep",
                macro: "Macro",
            },

            // 灯光设置
            lighting: "Lighting",
            type: "Light Type",
            selectType: "Select light type",
            types: {
                natural: "Natural Light",
                studio: "Studio",
                volumetric: "Volumetric",
                cinematic: "Cinematic",
                neon: "Neon",
                rim: "Rim",
            },
            source: "Light Source Position",
            selectSource: "Select light source position",
            sources: {
                front: "Front",
                side: "Side",
                topDown: "Top",
                bottomUp: "Bottom",
                backlight: "Backlight",
            },
            intensity: "Light Intensity",
        },
        validation: {
            missingDescription: "Layer description cannot be empty",
            missingDescriptionDesc: "{{count}} layer(s) missing description, please fill in descriptions before previewing JSON",
        },
        jsonPreviewDialog: {
            title: "Configuration Preview",
            description: "View JSON configuration and get AI-optimized prompts",
            jsonLabel: "Creator JSON",
            promptLabel: "Professional Prompt",
            convertButton: "Convert Prompt",
            convertingButton: "Converting...",
            copyButton: "Copy",
            copiedButton: "Copied",
            generateImageButton: "Generate Image",
            toast: {
                convertFailed: "Failed to convert prompt",
                convertSuccess: "Prompt converted successfully",
                copySuccess: "Copied to clipboard",
            },
        },
        generating: {
            title: "Generating Image",
            description: "AI is generating your image, please wait...",
            hint: "You can switch to other tabs or menus, the generation will continue in the background",
            initiating: "Submitting generation task...",
            resuming: "Resuming generation task...",
            started: "Generation task created",
            processing: "Generating image, estimated {{eta}} seconds remaining...",
        },
        toast: {
            taskCreated: "Generation task created",
            taskCreateFailed: "Failed to create generation task",
            generationSuccess: "Image generated successfully",
            generationFailed: "Image generation failed",
            timeout: "Image generation timeout, please try again later",
            saveToMaterialsComingSoon: "Save to materials feature will be implemented later",
            comingSoon: "Coming Soon",
            copyToMaterialsSuccess: "Successfully copied {count} image(s) to materials",
            copyToMaterialsFailed: "Failed to copy to materials",
            error: {
                logNotFound: "Image generation log not found",
                notCompleted: "Image generation not completed yet, please wait for completion",
                noImages: "No images available to copy in this log",
                serverError: "Server error, please try again later",
                unauthorized: "Please login first",
                invalidFileType: "Invalid file type",
            },
        },
        reset: {
            dialogTitle: "Reset Canvas",
            dialogDescription: "This will reset the entire canvas to its initial state. All layers and settings will be cleared. Generated images will be preserved in your generation history.",
            cancel: "Cancel",
            confirm: "Reset",
            success: "Canvas has been reset successfully",
        },
        styleMode: {
            // Left sidebar - Base Image
            baseImage: {
                title: "Base Image",
                description: "Upload a black and white line drawing, AI will migrate the style while preserving the subject",
                dropHere: "Drag image here",
                orClick: "Or click to select file",
            },

            // Upload status
            uploading: "Uploading...",
            uploadingHint: "Uploading image to server",

            // Validation errors
            validation: {
                missingInput: "Incomplete Information",
                missingInputDesc: "Please upload an image and select a style",
                missingImage: "Please upload an image first",
                missingStyle: "Please select a style",
                missingModel: "No Model Selected",
                missingModelDesc: "Please select an image generation model",
                uploadFailed: "Image upload failed",
            },

            // Right sidebar - Style List
            styleList: {
                title: "Style List",
                custom: "Custom",
                customPlaceholder: "Enter style description (e.g., watercolor style, oil painting style...)",
                customConfirm: "Confirm",
                customCancel: "Cancel",
                loading: "Loading styles...",
                loadError: "Failed to load styles",
                retry: "Retry",
            },

            // Preview area
            preview: {
                original: "Original Preview",
                live: "Live Preview",
                reupload: "Re-upload",
                waitingForUpload: "Waiting for upload",
                uploadHint: "Upload an image and select a style to start creating",
            },

            // Action buttons
            generate: "Generate Image",
            rendering: "AI Rendering...",
            aiRendering: "AI is rendering",
            download: "Download Image",
            selected: "Selected",

            // Preset styles (kept for compatibility, but no longer used)
            presets: {
                cyberNeon: {
                    name: "Cyber Neon",
                    description: "High saturation neon colors, futuristic tech feel",
                },
                frostedGlass: {
                    name: "Frosted Glass",
                    description: "Semi-transparent texture, soft halo",
                },
                minimalLine: {
                    name: "Minimal Line",
                    description: "Black and white lines, simple and elegant",
                },
                warmOil: {
                    name: "Warm Oil",
                    description: "Heavy brushstrokes, warm tones",
                },
                anime: {
                    name: "Anime",
                    description: "Japanese animation style, bright colors",
                },
                watercolor: {
                    name: "Watercolor",
                    description: "Flowing colors, natural fusion",
                },
            },

            // Advanced options
            advancedOptions: "Advanced Options",
            styleStrength: "Style Strength",
            subtle: "Subtle",
            strong: "Strong",

            // Bottom hint
            hint: "After selecting a style, click the 'Generate Image' button and AI will automatically apply the selected style effect to your image.",
            thisMayTake: "This may take a few seconds",
        },
        inversionMode: {
            // 上传区域
            upload: {
                title: "Image Upload",
                description: "Upload image to split",
                dropHere: "Drag image here",
                orClick: "Or click to select file",
            },

            // 操作按钮
            splitImage: "Split Image",
            splitting: "AI is splitting image...",
            reupload: "Re-upload",

            // 状态消息
            splitCompleted: "Split completed!",
            successfullySplit: "Successfully split into {count} layers",



            // 结果区域
            splitResults: "Split Results",
            layersCount: "{count} layers",
            selectAll: "Select All",
            deselectAll: "Deselect All",
            downloadSelected: "Download Selected",
            waiting: "Waiting to split",
            waitingHint: "After uploading an image and clicking the split button, the split layers will be displayed here",

            // 底部提示
            hint: "After uploading an image, click the 'Split Image' button and AI will automatically decompose the image into multiple layers.",

            // 图层数量选择
            numLayers: {
                label: "Split Layers",
                description: "Choose the number of layers to split (1-8 layers)",
            },

            // 场景描述
            prompt: {
                label: "Scene Description",
                placeholder: "Describe the scene content, e.g., A landscape painting with mountains",
                description: "Providing scene description helps AI split layers more accurately",
            },

            // 验证提示
            validation: {
                missingImage: "Please upload an image first",
                invalidNumLayers: "Number of layers must be between 1 and 8",
            },

            // 图层默认命名
            layers: {
                default: "Layer {index}",
                defaultDescription: "Split layer {index}",
                mainSubject: {
                    name: "Main Subject Layer",
                    description: "The main subject of the image",
                },
                background: {
                    name: "Background Layer",
                    description: "The background part of the image",
                },
                details: {
                    name: "Details Layer",
                    description: "Details and textures of the image",
                },
                lighting: {
                    name: "Lighting Layer",
                    description: "Lighting and shadow effects",
                },
            },
        },

        // 新增：提示词预览
        promptPreview: {
            title: "View Prompt",
            description: "View the prompt used for this generation",
            copy: "Copy Prompt",
            copied: "Copied!",
            copyFailed: "Failed to copy prompt",
        },

        // 新增：生成记录
        logs: {
            filterStatus: "Status:",
            filterMode: "Mode:",
            filterModel: "Model:",

            status: {
                all: "All Status",
                pending: "Pending",
                processing: "Processing",
                success: "Success",
                failed: "Failed",
            },

            mode: {
                all: "All Modes",
                creator: "Creator",
                style: "Style",
                split_images: "Inversion",
            },

            model: {
                all: "All Models",
            },

            table: {
                time: "Time",
                mode: "Mode",
                model: "Model",
                status: "Status",
                images: "Images",
                actions: "Actions",
                noData: "No generation logs found",
                clickToPreview: "Click to preview",
            },

            actions: {
                viewPrompt: "View Prompt",
                download: "Download",
                copyToMaterials: "Copy to Materials",
                copying: "Copying...",
            },

            preview: {
                title: "Image Preview",
                imageInfo: "Image {current} / {total}",
            },

            toast: {
                fetchFailed: "Failed to fetch generation logs",
            },
        },
    },
    knowledgeCards: {
        title: "Knowledge Cards",
        subtitle: "Convert any content into structured knowledge cards",
        configTitle: "Configure Knowledge Cards",
        contentLabel: "Content",
        contentPlaceholder: "Please enter a link or text content (supports web links, articles, notes, etc.)",
        contentMinError: "Content must be at least 10 characters",
        contentMaxError: "Content cannot exceed 10000 characters",
        contentDesc: "Enter the content you want to convert into knowledge cards, can be a URL or any text",
        styleLabel: "Card Style",
        layoutLabel: "Card Layout",
        langLabel: "Language",
        countLabel: "Card Count",
        countDesc: "Generate 1-20 cards (default 5)",
        reqLabel: "Requirements",
        reqPlaceholder: "Optional: special requirements or focus",
        reqDesc: "Special requirements for generated cards can be stated here",
        previewLabel: "Style Preview",
        generateBtn: "Generate Knowledge Cards",
        resultTitle: "Generated Knowledge Cards",
        printBtn: "Print Cards",
        downloadBtn: "Download HTML",
        toast: {
            generateSuccess: "Successfully generated {count} knowledge cards!",
            generateError: "Error generating cards, please try again",
        },
    },
    seoGeo: {
        title: "SEO/GEO",
        subtitle: "SEO and geographic optimization tools",
        analysisTitle: "Keyword Analysis",
        analysisDesc: "Enter keywords to get a detailed SEO analysis report",
        recommendationTitle: "Recommended Keywords",
        recommendationDesc: "Related long-tail keyword recommendations",
        insightTitle: "Market Insights",
        insightDesc: "Keyword market trends and competition analysis",
        searchInputPlaceholder: "Enter keyword to analyze...",
        analyzeBtn: "Analyze",
        analyzingBtn: "Analyzing...",
        startAnalysisTitle: "Start Keyword Analysis",
        startAnalysisDesc: "Enter keywords to get a detailed SEO analysis report, including search volume, competition, suggestions, etc.",
        keywordLabel: "Keyword: ",
        analyzedAtLabel: "Analyzed At: ",
        insights: {
            searchTrendTitle: "Keyword Search Volume Trend",
            searchTrendDesc: "Search volume trend over the past 12 months",
            difficultyTitle: "Keyword Difficulty Distribution",
            difficultyDesc: "Distribution of keywords across different difficulty levels",
            competitorTitle: "Competitor Analysis",
            competitorDesc: "SEO performance comparison of major competitors",
            stats: {
                totalKeywords: "Total Keywords",
                avgSearchVolume: "Avg Search Volume",
                avgDifficulty: "Avg Difficulty",
                estTraffic: "Est. Traffic",
                vsLastMonth: "vs Last Month",
            },
            dataDescTitle: "Data Notes:",
        },
        recommendations: {
            table: {
                rank: "Rank",
                keyword: "Keyword",
                msv: "MSV",
                difficulty: "Difficulty",
                rating: "Rating",
                advantage: "Advantage",
                actions: "Actions",
            },
            dialog: {
                title: "Detailed Keyword Analysis: ",
                msvLabel: "MSV",
                difficultyLabel: "Difficulty Score",
            },
            difficultyLevels: {
                easy: "Easy",
                quiteEasy: "Quite Easy",
                medium: "Medium",
                hard: "Hard",
            },
            notesTitle: "Notes:",
        },
    },
    auth: {
        login: "Login",
        signup: "Sign Up",
        email: "Email",
        password: "Password",
        sendVerificationCode: "Send Verification Code",
        sendCodeHint: "We'll send a 6-digit verification code to your email",
        back: "Back",
        verificationCode: "Verification Code",
        verificationCodeSent: "Verification code sent to",
        verificationCodePlaceholder: "Enter 6-digit code",
        verificationCodeValid: "Valid for 15 minutes",
        sending: "Sending...",
        resendInSeconds: "seconds to resend",
        resend: "Resend",
        newPassword: "New Password",
        newPasswordPlaceholder: "At least 8 characters",
        confirmPassword: "Confirm Password",
        confirmPasswordPlaceholder: "Enter password again",
        verifyAndSignup: "Verify & Sign Up",
        resetPassword: "Reset Password",
        forgotPassword: "Forgot password?",
        noAccount: "Don\'t have an account?",
        hasAccount: "Already have an account?",
        continueWith: "Or continue with",
        continueWithGoogle: "Continue with Google",
        welcomeBack: "Welcome Back",
        loginSubtitle: "Sign in to your account to continue",
        createAccount: "Create Account",
        signupSubtitle: "Sign up to get started with your account",
        loginSuccess: "Login successful",
        redirecting: "Redirecting...",
        passwordMismatch: "Passwords do not match",
        passwordMismatchDescription: "Please make sure both passwords are the same",
        passwordStrength: {
            weak: "Weak",
            fair: "Fair",
            good: "Good",
            strong: "Strong",
            veryStrong: "Very Strong",
        },
        verifyEmailTitle: "Verify Your Email",
        verifyEmailDescription: "We\'ve sent a verification email to your registered email address. Please check your inbox and click the verification link to activate your account.",
        verifyEmailInstructions: "If you don\'t see the email in your inbox, please check your spam folder or request a new verification email.",
        verifyEmailNote: "Note: You need to verify your email before signing in",
        backToLogin: "Back to Login",
        forgotPasswordDescription: "Enter your email address and we\'ll send you a link to reset your password",
        profile: "Profile",
        logout: "Logout",
        changePasswordDescription: "You will need to login again after changing password",
        oldPassword: "Old Password",
        confirm: "Confirm",
        success: "Success",
        error: "Error",
        passwordChanged: "Password changed, please login again",
        passwordTooShort: "Password must be at least 8 characters",
        unknownError: "Unknown error",
        noEmail: "No email",
        signupComplete: "Sign up successful, please login",
        passwordResetComplete: "Password reset successful, please login",
        toast: {
            loginSuccess: "Login successful",
            loginFailed: "Login failed",
            googleLoginFailed: "Google login failed",
            sendFailed: "Send failed",
            verificationCodeSent: "Verification code sent",
            checkYourEmail: "Please check your email",
            signupSuccess: "Sign up successful",
            pleaseLogin: "Please login with your email and password",
            logoutSuccess: "Logged out successfully",
            resetFailed: "Reset failed",
            passwordResetSuccess: "Password reset successful",
            loginWithNewPassword: "Please login with your new password",
            loginWithCredentials: "Please login with your email and password",
            resetCodeSent: "If this email is registered, you will receive a password reset code",
            pleaseTryAgain: "Please try again",
        },
        oauth: {
            missingParams: "Missing OAuth parameters",
            stateVerificationFailed: "State parameter verification failed",
            loginFailed: "OAuth login failed",
            completingGoogleLogin: "Completing Google login...",
            processingLoginInfo: "Please wait while we process your login information",
            loginSuccess: "Login successful!",
            redirecting: "Redirecting...",
            loginFailedTitle: "Login failed",
            redirectingToLogin: "Redirecting to login page...",
        },
        agreeToTerms: "I have read and agree to the",
        and: "and",
        termsRequired: "You must agree to all terms to continue registration",
    },
    tiptapEditor: {
        toolbar: {
            undo: "Undo",
            redo: "Redo",
            bold: "Bold",
            italic: "Italic",
            underline: "Underline",
            strikethrough: "Strikethrough",
            code: "Code",
            heading: {
                paragraph: "Paragraph",
                heading1: "Heading 1",
                heading2: "Heading 2",
                heading3: "Heading 3",
            },
            bulletList: "Bullet List",
            orderedList: "Ordered List",
            quote: "Quote",
            codeBlock: "Code Block",
            horizontalRule: "Horizontal Rule",
            link: "Link",
            linkUrlPrompt: "Enter link URL:",
            image: "Image",
            uploading: "Uploading...",
            ai: "AI Writing",
            aiWriting: "AI Writing...",
        },
        toast: {
            editorNotReady: "Editor not initialized, please try again later",
            uploadingImage: "Uploading image...",
            imageInserted: "Image inserted into editor",
            selectTextFirst: "Please select text first",
            selectTextFirstDesc: "Please select the text you want to rewrite in the editor",
            saveBeforeAIRewrite: "Please save article first",
            saveBeforeAIRewriteDesc: "Please save the article before using AI rewrite",
        },
        autoSave: {
            saved: "Saved",
            saving: "Saving...",
            unsaved: "Unsaved",
            error: "Save failed",
        },
    },
    aiRewrite: {
        title: "AI Smart Rewrite",
        description: "Select a rewrite method, AI will optimize your content",
        selectedText: "Selected Text",
        rewrittenText: "Rewritten Content",
        rewrittenTextPlaceholder: "Generated results will be displayed here...",
        rewriteType: "Rewrite Type",
        generating: "Generating...",
        generate: "Generate",
        confirmApply: "Apply",
        cancel: "Cancel",
        restoreOriginal: "Restore Original",
        resultReady: "AI Rewrite Complete",
        waitingHint: "AI is rewriting, please wait... Results will appear automatically when ready",
        waitingPlaceholder: "AI rewrite results will appear automatically when ready...",
        submitting: "Submitting...",
        waiting: "Rewriting...",
        types: {
            material: "Material Expansion",
            style: "Style Adjustment",
            struct: "Structure Optimization"
        },
        material: {
            selectMaterials: "Select Materials",
            selectPlaceholder: "Please select materials...",
            noMaterials: "No materials available",
            loadingMaterials: "Loading materials...",
            loadingMore: "Loading more materials...",
            noMoreData: "All materials loaded",
            selectedCount: "{count} material(s) selected",
            typeLabels: {
                info: "Info",
                news: "News",
                image: "Image"
            }
        },
        style: {
            selectStyle: "Select Style",
            customRequirement: "Custom Requirement",
            customPlaceholder: "Enter custom style requirements...",
            styles: {
                Professional: "Professional",
                Concise: "Concise",
                Friendly: "Friendly",
                Colloquial: "Colloquial",
                Assertive: "Assertive",
                Restrained: "Restrained",
                Custom: "Custom"
            },
            descriptions: {
                Professional: "Use professional terminology and formal expression",
                Concise: "Simplify content and highlight key points",
                Friendly: "Warm and natural tone",
                Colloquial: "Casual, conversational style",
                Assertive: "Confident and powerful expression",
                Restrained: "Subtle and understated expression",
                Custom: "Enter custom style requirements"
            }
        },
        struct: {
            selectStructure: "Structure Optimization",
            structures: {
                "De-Redundancy": "Remove Redundancy",
                "Information-Layering": "Information Layering",
                "Point-Form": "Bullet Points",
                "Short-Sentencing": "Short Sentences",
                "Data-Highlighting": "Data Highlighting"
            },
            descriptions: {
                "De-Redundancy": "Eliminate repetitive and wordy expressions",
                "Information-Layering": "Reorganize information by importance",
                "Point-Form": "Convert paragraph to bulleted list",
                "Short-Sentencing": "Break long sentences into shorter ones",
                "Data-Highlighting": "Emphasize key data and important information"
            }
        },
        toast: {
            customStyleRequired: "Custom Style Required",
            customStyleRequiredDesc: "Please enter custom style requirements",
            retryError: "Rewrite failed, please try again",
            contentApplied: "Content applied",
            materialRequired: "Materials Required",
            materialRequiredDesc: "Please select at least one material",
            fetchMaterialsFailed: "Failed to fetch materials",
            generateSuccess: "Generation successful",
            generateFailed: "Generation failed",
            submitted: "AI rewrite task submitted",
            submittedDesc: "You'll be notified when the rewrite is complete",
            resultReady: "Click the blue waiting block in the editor to view results",
            timeout: "AI Rewrite Timeout",
            timeoutDesc: "The AI rewrite task timed out, please try again",
            taskExpired: "AI rewrite task expired",
            quotaExceeded: "Storage full, old tasks cleaned up",
        },
    },
    cookieBanner: {
        types: {
            necessary: {
                name: "Necessary",
                description: "These cookies are essential for the website to function properly and cannot be disabled. They help with logging in and setting privacy preferences."
            },
            analytics: {
                name: "Analytics",
                description: "These cookies help us improve the website by tracking which pages are most popular and how visitors navigate through the site."
            }
        },
        banner: {
            description: "We use cookies on our site to enhance your user experience, provide personalized content, and analyze our traffic.<a href=\"/cookie-policy\" target=\"_blank\">Cookie Policy</a>",
            acceptAll: "Accept All",
            acceptAllLabel: "Accept all cookies",
            rejectNonEssential: "Reject Non-Essential",
            rejectNonEssentialLabel: "Reject non-essential cookies",
            preferences: "Preferences",
            preferencesLabel: "Toggle cookie preferences"
        },
        preferences: {
            title: "Customize Your Cookie Preferences",
            description: "We respect your privacy. You can choose to disable certain types of cookies. Your cookie preferences will apply to this entire website.",
            creditLink: "Get this banner free",
            creditLinkLabel: "Get this banner free"
        }
    },
    cookiePolicy: {
        title: "Cookie Policy",
        subtitle: "Learn how we use cookies and similar technologies",
        introduction: "This Cookie Policy explains how JoyfulWords (Creator Toolbox) uses cookies and similar technologies, and how you can manage your cookie preferences.",
        whatAreCookies: {
            title: "What are Cookies?",
            description: "Cookies are small text files stored on your device when you visit websites. They are widely used to remember your preferences, keep you logged in, understand how you use the site, and provide relevant content."
        },
        types: {
            title: "Types of Cookies We Use",
            necessary: {
                name: "Necessary Cookies",
                description: "These cookies are essential for the website to function properly. Without them, the site cannot work as intended. They are usually only set in response to actions you take.",
                examples: [
                    "Keeping you logged in",
                    "Remembering your privacy preferences",
                    "Ensuring the website runs securely"
                ]
            },
            analytics: {
                name: "Analytics Cookies",
                description: "These cookies help us understand how visitors use our website by collecting information about which pages are most popular and how visitors navigate through the site. This information helps us improve site performance and user experience.",
                examples: [
                    "Tracking page views and user behavior",
                    "Analyzing site performance and engagement",
                    "Identifying site issues and improvement opportunities"
                ]
            }
        },
        howToManage: {
            title: "How to Manage Cookies",
            description: "You can manage cookies in several ways. You can set your preferences through our website's cookie banner, or manage all cookies through your browser settings.",
            browserSettings: {
                title: "Browser Settings",
                chrome: "Chrome: Settings > Privacy and security > Cookies and other site data",
                firefox: "Firefox: Options > Privacy & Security > Cookies and Site Data",
                safari: "Safari: Preferences > Privacy > Manage Website Data",
                edge: "Edge: Settings > Cookies and site permissions > Cookies and site data"
            }
        },
        updates: {
            title: "Updates to This Policy",
            description: "We may update this Cookie Policy from time to time. Any changes will be posted on this page, and you will be notified through the website before the policy takes effect."
        },
        contact: {
            title: "Contact Us",
            description: "If you have any questions or concerns about this Cookie Policy, please contact us at:",
            email: "support@joyword.link"
        },
        lastUpdated: "Last Updated"
    },
    legal: {
        termsOfUse: "Terms of Use",
        privacyPolicy: "Privacy Policy",
        cookiePolicy: "Cookie Policy"
    },
    termsOfUse: {
        title: "Terms of Use",
        subtitle: "Welcome to JoyfulWords (Creator Toolbox)",
        introduction: "Welcome to JoyfulWords (Creator Toolbox). These Terms of Use ('Terms') govern your use of our website and services. By accessing or using our services, you agree to be bound by these Terms.",
        acceptance: {
            title: "Acceptance of Terms",
            description: "By creating an account or using our services, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services."
        },
        services: {
            title: "Our Services",
            description: "JoyfulWords is a content creation tool platform that provides the following features:",
            features: [
                "Material search and management",
                "Competitor tracking and analysis",
                "AI-assisted article writing",
                "Knowledge card generation",
                "Image generation tools",
                "SEO/GEO analysis"
            ]
        },
        responsibilities: {
            title: "User Responsibilities",
            description: "When using our services, you agree to:",
            items: [
                "Provide accurate and complete registration information",
                "Maintain account security and be responsible for all activities under your account",
                "Comply with all applicable laws and regulations",
                "Not abuse the service or interfere with other users' experience"
            ]
        },
        intellectualProperty: {
            title: "Intellectual Property",
            description: "All content in the services, including but not limited to text, graphics, logos, images, and software, is the property of JoyfulWords or its content suppliers and is protected by intellectual property laws. You may not reproduce, modify, distribute, or otherwise use our content without written permission."
        },
        liability: {
            title: "Limitation of Liability",
            description: "To the maximum extent permitted by law, JoyfulWords shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the services."
        },
        termination: {
            title: "Service Termination",
            description: "We reserve the right to suspend or terminate your access to the services at any time without prior notice, including but not limited to violations of these Terms."
        },
        changes: {
            title: "Changes to Terms",
            description: "We may update these Terms from time to time. Continued use of the services after changes indicates your acceptance of the updated Terms. We will notify you of significant changes through the website."
        },
        governingLaw: {
            title: "Governing Law",
            description: "These Terms are governed by the laws of your jurisdiction."
        },
        contact: {
            title: "Contact Us",
            description: "If you have any questions about these Terms of Use, please contact us at:",
            email: "support@joyword.link"
        },
        lastUpdated: "Last Updated"
    },
    privacyPolicy: {
        title: "Privacy Policy",
        subtitle: "Learn how we protect your information",
        introduction: "JoyfulWords (Creator Toolbox) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your information, in compliance with GDPR, CCPA, and other international privacy regulations.",
        dataCollection: {
            title: "Information We Collect",
            description: "We collect the following types of information:",
            personalInfo: {
                title: "Personal Information",
                items: [
                    "Account information: email address, name",
                    "Usage data: created articles, materials, settings",
                    "Payment information: payment transaction details (processed through third-party payment processors)"
                ]
            },
            usageData: {
                title: "Usage Data",
                items: [
                    "Access logs: IP address, browser type, device information",
                    "Usage statistics: page visits, feature usage",
                    "Cookie data: preferences collected through cookies"
                ]
            }
        },
        dataUsage: {
            title: "How We Use Your Information",
            purposes: [
                "To provide, maintain, and improve our services",
                "To process transactions and send related notifications",
                "To send you technical notices, updates, and security alerts",
                "To respond to your comments, questions, and requests",
                "To monitor and analyze usage trends to improve the service"
            ]
        },
        dataSharing: {
            title: "Information Disclosure",
            description: "We do not sell, rent, or trade your personal information. We only disclose information in the following circumstances:",
            exceptions: [
                "With your consent",
                "To comply with legal obligations or respond to court orders",
                "To protect our rights, property, or safety",
                "With trusted service providers (under confidentiality agreements)"
            ]
        },
        security: {
            title: "Data Security",
            description: "We implement reasonable technical and organizational measures to protect your information from unauthorized access, use, or disclosure. However, no method of transmission or storage is completely secure."
        },
        rights: {
            title: "Your Rights (GDPR/CCPA)",
            description: "Under applicable privacy laws, you have the following rights:",
            items: [
                "Access: Request a copy of your personal information we hold",
                "Rectification: Request correction of inaccurate information",
                "Erasure: Request deletion of your personal information",
                "Restriction: Request restriction on how we use your information",
                "Portability: Request transfer of your information to another service",
                "Object: Object to our processing of your information"
            ]
        },
        retention: {
            title: "Data Retention",
            description: "We retain your personal information for as long as necessary to achieve the purposes outlined in this policy, unless a longer retention period is required or permitted by law."
        },
        international: {
            title: "International Data Transfers",
            description: "Your information may be transferred to and processed in countries other than your own. We take appropriate steps to ensure your data remains protected."
        },
        children: {
            title: "Children's Privacy",
            description: "Our services are not directed to children under 16. We do not knowingly collect personal information from children under 16. If we discover we have collected such information, we will take steps to delete it."
        },
        cookies: {
            title: "Cookies and Tracking Technologies",
            description: "We use cookies and similar technologies to collect and track information. You can manage your cookie preferences through your browser settings. For more information, please see our",
            cookiePolicyLink: "Cookie Policy"
        },
        changes: {
            title: "Policy Changes",
            description: "We may update this Privacy Policy from time to time. Continued use of the services after changes indicates your acceptance of the updated policy. We will notify you of significant changes through the website."
        },
        contact: {
            title: "Contact Us",
            description: "If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us at:",
            email: "support@joyword.link"
        },
        lastUpdated: "Last Updated"
    },
    landing: {
        nav: {
            features: "Features",
            blog: "Blog",
            myArticles: "My Articles",
            startCreating: "Start Creating →",
        },
        badge: "AI-Powered Content Platform",
        heading: "Write Better Content,",
        headingAccent: "Faster",
        description: "JoyfulWords is an AI-powered writing workspace where you collect, organize, and turn materials into great content.",
        cta: "Start Creating",
        viewArticles: "View My Articles",
        stats: {
            speed: "10×",
            speedLabel: "Writing Speed",
            tools: "6 in 1",
            toolsLabel: "Integrated Tools",
            seo: "Real-time",
            seoLabel: "Web Search",
        },
        featuresLabel: "FULL TOOLKIT",
        featuresHeading: "Everything You Need, ",
        featuresHeadingAccent: "Built In",
        featuresSubheading: "Turn ideation, writing, imagery, source collection, discoverability, and competitive research into one connected content workflow.",
        featuresBadgePrimary: "Primary",
        featuresBadgeSupport: "Support",
        features: {
            aiWriting: {
                eyebrow: "Core Engine",
                title: "AI Smart Writing",
                desc: "Go from topic to outline to full draft in one flow, with built-in continuation, rewriting, and tone switching.",
            },
            imageGen: {
                eyebrow: "Visual Layer",
                title: "One-Click Images",
                desc: "Generate illustrations or add supporting visuals while you write, without breaking your editing workflow.",
            },
            seoGeo: {
                eyebrow: "Distribution",
                title: "SEO / GEO Optimization",
                desc: "Improve titles, keywords, and structure so your content performs in search engines and AI answers.",
            },
            knowledgeCards: {
                eyebrow: "Content Extraction",
                title: "Knowledge Cards",
                desc: "Turn dense ideas into compact, shareable cards that work well for repurposing and social distribution.",
            },
            materialSearch: {
                eyebrow: "Asset Hub",
                title: "Material Library",
                desc: "Collect, organize, and reuse links, images, and references in one place so materials become lasting content assets.",
            },
            competitors: {
                eyebrow: "Market Read",
                title: "Competitor Reference",
                desc: "Review similar content angles, structures, and keyword strategies quickly to find your strongest positioning.",
            },
        },
        ctaHeading: "Start Your First Article",
        ctaSubtitle: "Begin your content creation journey.",
        ctaCta: "Start Creating →",
        footer: {
            version: "Content Creation Tool · v1.0.0",
            privacyPolicy: "Privacy Policy",
            termsOfUse: "Terms of Use",
        },
    },
    blog: {
        common: {
            backToHome: "Back Home",
            backToBlog: "Back to Blog",
            readMore: "Read More",
            noPosts: "No blog posts yet",
            missingArticle: "Article not found",
            fallbackNotice: "This locale is unavailable, so the {locale} version is shown instead.",
            localeLabel: "Language",
        },
        list: {
            title: "Blog",
            subtitle: "Product updates, creation workflows, and practical insights.",
        },
        detail: {
            articleLabel: "Article",
        },
    },
    billing: {
        balance: {
            title: "Credit Balance",
            credits: "credits",
            refresh: "Refresh",
            recharge: "Recharge",
            updatedAt: "Updated {time}",
            cached: "cached",
            exchangeRate: "100 credits = $1",
            fetchFailed: "Failed to fetch balance",
            refreshFailed: "Failed to refresh balance",
            refreshSuccess: "Refreshed successfully",
            rechargeComingSoon: "Recharge feature coming soon",
            rechargeComingSoonDesc: "We are working on the recharge feature, stay tuned",
        },
        insufficientCredits: {
            title: "Insufficient Credits",
            description: "You don't have enough credits to perform this action",
            currentCredits: "Current Credits",
            requiredCredits: "Required Credits",
            shortageCredits: "Shortage",
            recommendedRecharge: "Recommended Recharge",
            goToRecharge: "Go to Recharge",
            cancel: "Cancel",
        },
        payment: {
            dialog: {
                title: "Recharge Credits",
            },
            providers: {
                paypal: "PayPal",
                oxapay: "Crypto",
                stripe: "Stripe",
            },
            form: {
                selectTier: "Select Recharge Tier",
                customAmount: "Or enter custom amount (minimum 200 credits)",
                credits: {
                    label: "Credits",
                    hint: "100 credits = $1 USD, must be a multiple of 100",
                    required: "Please enter credits",
                    invalid: "Invalid credits format",
                    min: "Minimum recharge is 200 credits",
                    max: "Maximum recharge is 100,000 credits",
                    multiple: "Credits must be a multiple of 100",
                },
                network: {
                    label: "Network",
                    placeholder: "Select network",
                    required: "Please select network",
                    trc20: "TRC20 (Tron)",
                    erc20: "ERC20 (Ethereum)",
                },
                totalAmount: "Total Amount",
                submit: "Proceed to Payment",
                payWithPaypal: "Pay with PayPal",
                paypalSecure: "Secure PayPal payment",
                payWithStripe: "Pay with Stripe",
                stripeSecure: "Secure payment powered by Stripe",
                submitting: "Processing...",
            },
            processing: "Processing order...",
            success: {
                title: "Recharge Successful!",
                desc: "{credits} credits have been added",
                confirming: "Confirming payment...",
                confirmingDesc: "Verifying payment status, please wait",
                processing: "Payment Processing",
                processingDesc: "Retrieving order information, please wait",
                processingHint: "Your payment is being processed, please check back later to see if credits have been added",
                pending: "Awaiting confirmation...",
                pendingDesc: "Payment completed, crediting account...",
                retryCount: "Retry count: {count}",
                backToBilling: "Back to Billing",
            },
            failed: {
                title: "Payment Failed",
                desc: "Payment could not be completed, please try again",
                retry: "Try Again",
            },
            timeout: {
                title: "Confirmation Timeout",
                desc: "Payment confirmation took too long, please check back or retry",
            },
            cancel: {
                title: "Payment Cancelled",
                desc: "You cancelled the payment, you can recharge anytime",
                goBack: "Go Back",
            },
            orderNo: "Order No.",
            provider: "Payment Provider",
            error: {
                unauthorized: "Unauthorized, please login again",
                createFailed: "Failed to create order",
                queryFailed: "Failed to query order",
                unknown: "Unknown error",
            },
        },
        tabs: {
            recharges: "Credit Recharges",
            usage: "Credit Usage",
            invoices: "Invoices",
        },
        recharges: {
            fetchFailed: "Failed to fetch recharge records",
        },
        usage: {
            fetchFailed: "Failed to fetch usage records",
        },
        invoices: {
            fetchFailed: "Failed to fetch invoices",
            detailFetchFailed: "Failed to fetch invoice detail",
            status: {
                draft: "Draft",
                finalized: "Finalized",
                voided: "Voided",
                failed: "Failed",
                pending: "Pending",
            },
            paymentStatus: {
                succeeded: "Succeeded",
                pending: "Pending",
                failed: "Failed",
            },
            table: {
                issuingDate: "Issuing Date",
                number: "Invoice Number",
                status: "Status",
                paymentStatus: "Payment Status",
                credit: "Credit",
                totalAmount: "Total Amount",
            },
            detail: {
                title: "Invoice Details",
                number: "Invoice Number",
                issuingDate: "Issuing Date",
                status: "Status",
                paymentStatus: "Payment Status",
                feesAmount: "Fees Amount",
                prepaidAmount: "Prepaid Credits",
                totalAmount: "Total Amount",
                feeItems: "Fee Items",
                itemName: "Item",
                units: "Units",
                unitPrice: "Unit Price",
                amount: "Amount",
                createdAt: "Created At",
            },
        },
        status: {
            pending: "Pending",
            settled: "Settled",
            failed: "Failed",
        },
        table: {
            date: "Time",
            transactionId: "Transaction ID",
            description: "Description",
            amount: "Amount",
            credits: "Credits",
            status: "Status",
            metadata: "Metadata",
            loading: "Loading...",
            noData: "No data available",
            totalInfo: "Total {total}, Page {page}",
            pageInfo: "Page {page} of {totalPages}",
            prevPage: "Previous",
            nextPage: "Next",
            filterStatus: "Status:",
            filterStatusAll: "All Status",
            filterStartDate: "Start Date:",
            filterEndDate: "End Date:",
            search: "Search",
            perPage: "Per page",
            items: "items",
        },
        transaction: {
            recharge: "Recharge",
            usage: "Usage",
        },
    },
};
