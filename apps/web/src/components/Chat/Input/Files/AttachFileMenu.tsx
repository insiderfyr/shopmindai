import { useSetRecoilState } from 'recoil';
import * as Ariakit from '@ariakit/react';
import React, { useRef, useState, useMemo } from 'react';
import { ImageUpIcon } from 'lucide-react';
import type { EndpointFileConfig } from 'librechat-data-provider';
import { useLocalize, useFileHandling } from '~/hooks';
import { FileUpload, TooltipAnchor, DropdownPopup, AttachmentIcon } from '~/components';
import { ephemeralAgentByConvoId } from '~/store';
import { cn } from '~/utils';

interface AttachFileMenuProps {
  conversationId: string;
  disabled?: boolean | null;
  endpointFileConfig?: EndpointFileConfig;
}

const AttachFileMenu = ({ disabled, conversationId, endpointFileConfig }: AttachFileMenuProps) => {
  const localize = useLocalize();
  const isUploadDisabled = disabled ?? false;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPopoverActive, setIsPopoverActive] = useState(false);
  const setEphemeralAgent = useSetRecoilState(ephemeralAgentByConvoId(conversationId));
  const { handleFileChange } = useFileHandling({
    overrideEndpointFileConfig: endpointFileConfig,
  });

  const handleUploadClick = (isImage?: boolean) => {
    if (!inputRef.current) {
      return;
    }
    inputRef.current.value = '';
    inputRef.current.accept = isImage === true ? 'image/*' : '';
    inputRef.current.click();
    inputRef.current.accept = '';
  };

  const dropdownItems = useMemo(() => {
    return [
      {
        label: localize('com_ui_upload_image_input'),
        onClick: () => {
          handleUploadClick(true);
        },
        icon: <ImageUpIcon className="icon-md" />,
      },
    ];
  }, [localize]);

  const menuTrigger = (
    <TooltipAnchor
      render={
        <Ariakit.MenuButton
          disabled={isUploadDisabled}
          id="attach-file-menu-button"
          aria-label="Attach File Options"
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-200 active:bg-gray-200 focus:outline-none dark:hover:bg-gray-600 dark:active:bg-gray-600',
          )}
        >
          <div className="flex w-full items-center justify-center gap-2">
            <AttachmentIcon />
          </div>
        </Ariakit.MenuButton>
      }
      id="attach-file-menu-button"
      description={localize('com_sidepanel_attach_files')}
      disabled={isUploadDisabled}
    />
  );

  return (
    <FileUpload
      ref={inputRef}
      handleFileChange={(e) => {
        handleFileChange(e, undefined);
      }}
    >
      <DropdownPopup
        menuId="attach-file-menu"
        isOpen={isPopoverActive}
        setIsOpen={setIsPopoverActive}
        modal={true}
        unmountOnHide={true}
        trigger={menuTrigger}
        items={dropdownItems}
        iconClassName="mr-0"
      />
    </FileUpload>
  );
};

export default React.memo(AttachFileMenu);
