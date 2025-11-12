import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { requireAdmin } from '@/lib/middleware/authMiddleware';
import connectDB from '@/lib/utils/db';
import SystemSettings from '@/lib/models/SystemSettings';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireAdmin(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'logo' or 'favicon'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['logo', 'favicon'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "logo" or "favicon"' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and ICO files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await connectDB();

    // Get existing settings to delete old image if exists
    const settings = await SystemSettings.findOne();
    const oldPublicId = type === 'logo' ? settings?.logoPublicId : settings?.faviconPublicId;

    // Delete old image from Cloudinary if exists
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (error) {
        console.error('Error deleting old image from Cloudinary:', error);
        // Continue even if deletion fails
      }
    }

    // Upload new image to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: `scoring-app/settings`,
        resource_type: 'image',
      };

      // Special handling for favicons
      if (type === 'favicon') {
        uploadOptions.transformation = [
          { width: 32, height: 32, crop: 'fill' },
          { quality: 'auto' },
          { format: 'png' },
        ];
      } else {
        // Logo transformations
        uploadOptions.transformation = [
          { height: 200, crop: 'scale' },
          { quality: 'auto' },
          { format: 'auto' },
        ];
      }

      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(buffer);
    });

    const result = uploadResult as any;

    // Update settings with new image URL and publicId
    const updateData = type === 'logo'
      ? { logoUrl: result.secure_url, logoPublicId: result.public_id }
      : { faviconUrl: result.secure_url, faviconPublicId: result.public_id };

    const updatedSettings = await SystemSettings.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      type,
      url: result.secure_url,
      publicId: result.public_id,
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// DELETE - Remove logo or favicon
export async function DELETE(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireAdmin(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'logo' or 'favicon'

    if (!type || !['logo', 'favicon'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "logo" or "favicon"' },
        { status: 400 }
      );
    }

    await connectDB();

    const settings = await SystemSettings.findOne();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    const publicId = type === 'logo' ? settings.logoPublicId : settings.faviconPublicId;

    // Delete from Cloudinary
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
      }
    }

    // Update settings to remove image
    const updateData = type === 'logo'
      ? { logoUrl: null, logoPublicId: null }
      : { faviconUrl: null, faviconPublicId: null };

    const updatedSettings = await SystemSettings.findOneAndUpdate(
      {},
      updateData,
      { new: true }
    );

    return NextResponse.json({
      success: true,
      type,
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
