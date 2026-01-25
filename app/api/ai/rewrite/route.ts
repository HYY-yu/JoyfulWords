import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, action, model = 'gpt-4' } = body;

    // 验证参数
    if (!text || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: text and action' },
        { status: 400 }
      );
    }

    // Mock AI 改写功能 - 根据不同的 action 返回不同的结果
    let rewrittenText = text;

    // 模拟 API 延迟
    await new Promise(resolve => setTimeout(resolve, 1500));

    switch (action) {
      case 'expand':
        // 扩写：添加更多细节
        rewrittenText = `${text}。这段内容通过 ${model} 模型扩写后，增加了更多的细节和描述，使得表达更加丰富和完整。通过深入的分析和延伸，我们可以看到更全面的视角和更深刻的理解。`;
        break;

      case 'condense':
        // 缩写：精简内容
        rewrittenText = text.substring(0, Math.max(20, Math.floor(text.length / 2))) + '...（已精简）';
        break;

      case 'rephrase':
        // 改写：换种说法
        rewrittenText = `【${model} 改写】${text}（以不同的表达方式呈现相同的意思）`;
        break;

      case 'polish':
        // 润色：优化表达
        rewrittenText = `✨ ${text} ✨（经 ${model} 润色优化，表达更加优雅流畅）`;
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        original: text,
        rewritten: rewrittenText,
        action: action,
        model: model,
      }
    });

  } catch (error) {
    console.error('AI rewrite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
