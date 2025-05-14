/**
 * Create a Bootstrap modal with the given parameters
 */
export function createModal({ id, title, content, onSave = null, showFooter = true, saveButtonText = 'Mentés' }) {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = id;
    modal.tabIndex = '-1';
    modal.setAttribute('aria-labelledby', `${id}Label`);
    modal.setAttribute('aria-hidden', 'true');
    
    // Create modal content
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="${id}Label">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                ${content}
                ${showFooter ? `
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Mégsem</button>
                    ${saveButtonText ? `<button type="button" class="btn btn-primary" id="${id}SaveBtn">${saveButtonText}</button>` : ''}
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.appendChild(modal);
    
    // Initialize Bootstrap modal
    const bootstrapModal = new bootstrap.Modal(modal);
    
    // Add save button event listener if provided
    if (onSave && saveButtonText) {
        document.getElementById(`${id}SaveBtn`).addEventListener('click', onSave);
    }
    
    // Remove modal from DOM after it's hidden
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
    
    return { modal, bootstrapModal };
}