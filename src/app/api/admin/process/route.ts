import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

export const dynamic = 'force-static';

const execAsync = promisify(exec);

const ROOT_DIR = path.resolve(process.cwd());

// 运行处理脚本
export async function POST(request: NextRequest) {
  // 注意：生产环境应该添加身份验证

  try {
    const scriptPath = path.join(ROOT_DIR, 'scripts', 'process_photos.py');
    
    // 执行 Python 脚本
    const { stdout, stderr } = await execAsync(`python "${scriptPath}"`, {
      cwd: ROOT_DIR,
      timeout: 300000 // 5分钟超时
    });

    if (stderr && !stderr.includes('DeprecationWarning')) {
      console.warn('脚本警告:', stderr);
    }

    console.log('脚本输出:', stdout);

    return NextResponse.json({ 
      success: true, 
      message: '图片处理完成',
      output: stdout 
    });
  } catch (error: any) {
    console.error('处理脚本执行失败:', error);
    return NextResponse.json({ 
      error: '处理失败', 
      details: error.message,
      stderr: error.stderr 
    }, { status: 500 });
  }
}
