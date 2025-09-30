import React from 'react';
import { render, screen } from '@testing-library/react';
import MessageContainer from '../../common/MessageContainer';

describe('MessageContainer', () => {
  const defaultProps = {
    isCreatedByUser: false,
    children: <div data-testid="message-content">Test message content</div>,
  };

  it('renders message content correctly', () => {
    render(<MessageContainer {...defaultProps} />);
    expect(screen.getByTestId('message-content')).toBeInTheDocument();
  });

  it('applies correct classes for user messages', () => {
    render(
      <MessageContainer
        {...defaultProps}
        isCreatedByUser={true}
        subRowContent={<div data-testid="subrow">SubRow content</div>}
      />
    );
    
    const container = screen.getByTestId('message-content').parentElement;
    expect(container).toHaveClass('flex', 'flex-col', 'gap-2', 'w-full');
  });

  it('applies correct classes for agent messages', () => {
    render(
      <MessageContainer
        {...defaultProps}
        isCreatedByUser={false}
        subRowContent={<div data-testid="subrow">SubRow content</div>}
      />
    );
    
    const container = screen.getByTestId('message-content').parentElement;
    expect(container).toHaveClass('flex', 'flex-col', 'gap-1');
  });

  it('shows SubRow when showSubRow is true and has content', () => {
    render(
      <MessageContainer
        {...defaultProps}
        showSubRow={true}
        hasActions={true}
        subRowContent={<div data-testid="subrow">SubRow content</div>}
      />
    );
    
    expect(screen.getByTestId('subrow')).toBeInTheDocument();
  });

  it('hides SubRow when showSubRow is false', () => {
    render(
      <MessageContainer
        {...defaultProps}
        showSubRow={false}
        subRowContent={<div data-testid="subrow">SubRow content</div>}
      />
    );
    
    expect(screen.queryByTestId('subrow')).not.toBeInTheDocument();
  });

  it('hides SubRow when isSubmitting is true', () => {
    render(
      <MessageContainer
        {...defaultProps}
        isSubmitting={true}
        subRowContent={<div data-testid="subrow">SubRow content</div>}
      />
    );
    
    expect(screen.queryByTestId('subrow')).not.toBeInTheDocument();
  });

  it('hides SubRow when hasActions is false', () => {
    render(
      <MessageContainer
        {...defaultProps}
        hasActions={false}
        subRowContent={<div data-testid="subrow">SubRow content</div>}
      />
    );
    
    expect(screen.queryByTestId('subrow')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <MessageContainer
        {...defaultProps}
        className="custom-class"
      />
    );
    
    const container = screen.getByTestId('message-content').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes for SubRow', () => {
    render(
      <MessageContainer
        {...defaultProps}
        isCreatedByUser={true}
        subRowContent={<div data-testid="subrow">SubRow content</div>}
      />
    );
    
    const subRow = screen.getByTestId('subrow').parentElement;
    expect(subRow).toHaveAttribute('role', 'toolbar');
    expect(subRow).toHaveAttribute('aria-label', 'User message actions');
  });

  it('has proper accessibility attributes for agent messages', () => {
    render(
      <MessageContainer
        {...defaultProps}
        isCreatedByUser={false}
        subRowContent={<div data-testid="subrow">SubRow content</div>}
      />
    );
    
    const subRow = screen.getByTestId('subrow').parentElement;
    expect(subRow).toHaveAttribute('role', 'toolbar');
    expect(subRow).toHaveAttribute('aria-label', 'Assistant message actions');
  });

  it('includes messageId in data attribute when provided', () => {
    render(
      <MessageContainer
        {...defaultProps}
        messageId="test-message-id"
        subRowContent={<div data-testid="subrow">SubRow content</div>}
      />
    );
    
    const subRow = screen.getByTestId('subrow').parentElement;
    expect(subRow).toHaveAttribute('data-message-id', 'test-message-id');
  });
});
